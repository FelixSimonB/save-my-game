import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDriveClient, ensureDriveFolderPath } from '@/lib/drive';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await req.formData();
  const folderId = formData.get('folderId') as string | null;
  const rootFolderName = formData.get('rootFolderName') as string | null;

  if (!folderId || !rootFolderName) {
    return new Response(JSON.stringify({ error: 'Missing folderId or rootFolderName' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const drive = await getDriveClient(session.accessToken);
  const rootFolderId = await ensureDriveFolderPath(drive, folderId, rootFolderName);

  return new Response(JSON.stringify({ rootFolderId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
