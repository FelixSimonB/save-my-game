import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDrive } from "@/lib/drive";
import { ZipArchive } from "archiver";
import { PassThrough } from "stream";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const folderId = req.nextUrl.searchParams.get("folderId");

  if (!session?.accessToken || !folderId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const drive = await getDrive(session.accessToken);

  const stream = new PassThrough();
  const archive = new ZipArchive({ zlib: { level: 9 } });

  archive.pipe(stream);

  async function addFolder(folderId: string, basePath = "") {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType)",
    });

    const files = res.data.files || [];

    for (const file of files) {
      const filePath = basePath ? `${basePath}/${file.name}` : file.name;

      if (filePath && file.mimeType === "application/vnd.google-apps.folder") {
        await addFolder(file.id!, filePath);
        continue;
      }

      const fileRes = await drive.files.get(
        { fileId: file.id!, alt: "media" },
        { responseType: "stream" }
      );

      archive.append(fileRes.data, { name: filePath! });
    }
  }

  await addFolder(folderId);

  await archive.finalize();

  return new Response(stream as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="drive.zip"`,
    },
  });
}