import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDriveClient, ensureDriveFolderPath } from '@/lib/drive';
import { Readable } from 'stream';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const folderId = formData.get('folderId') as string | null;
  const relativePath = formData.get('relativePath') as string | null;

  if (!file || !folderId) {
    return new Response(JSON.stringify({ error: 'Missing file or folderId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const drive = await getDriveClient(session.accessToken);

  let uploadFolderId = folderId;
  let fileName = file.name;

  let normalizedPath = relativePath
    ? relativePath.replace(/\\/g, '/').replace(/^\//, '')
    : null;


  if (normalizedPath) {
    const segments = normalizedPath.split('/').filter(Boolean);

    if (segments.length > 1) {
      const folders = segments.slice(0, -1).join('/');
      uploadFolderId = await ensureDriveFolderPath(drive, uploadFolderId, folders);
      fileName = segments[segments.length - 1];
    } else if (segments.length === 1) {
      // Single file (shouldn't happen with folder upload, but handle it)
      fileName = segments[0];
    }
  }

  const escapedFileName = fileName.replace(/'/g, "\\'");
  const existingFile = await drive.files.list({
    q: `name='${escapedFileName}' and trashed=false and '${uploadFolderId}' in parents`,
    fields: 'files(id,name)',
    pageSize: 1,
  });

  const existingFileId = existingFile.data.files?.[0]?.id;
  if (existingFileId) {
    await drive.files.update({
      fileId: existingFileId,
      media: {
        mimeType: file.type,
        body: Readable.from(buffer),
      },
    });
  } else {
    await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [uploadFolderId],
      },
      media: {
        mimeType: file.type,
        body: Readable.from(buffer),
      },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
