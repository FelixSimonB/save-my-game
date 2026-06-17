import { google } from 'googleapis';

export async function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  return google.drive({ version: 'v3', auth });
}

export async function createGameFolder(accessToken: string, gameName: string) {
  const drive = await getDriveClient(accessToken);
  const parentFolderName = 'save-my-game';

  const root = await drive.files.list({
    q: `name='${parentFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  });

  let rootId = root.data.files?.[0]?.id;
  if (!rootId) {
    const created = await drive.files.create({
      requestBody: {
        name: parentFolderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
    });
    rootId = created.data.id!;
  }

  const existingGameFolder = await drive.files.list({
    q: `name='${gameName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${rootId}' in parents`,
  });

  const existingFolderId = existingGameFolder.data.files?.[0]?.id;
  if (existingFolderId) {
    return existingFolderId;
  }

  const gameFolder = await drive.files.create({
    requestBody: {
      name: gameName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootId],
    },
  });

  return gameFolder.data.id!;
}

export async function listGameFolders(accessToken: string) {
  const drive = await getDriveClient(accessToken);
  const parentFolderName = 'save-my-game';

  const root = await drive.files.list({
    q: `name='${parentFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)',
    pageSize: 1,
  });

  const rootId = root.data.files?.[0]?.id;
  if (!rootId) {
    return [];
  }

  const children = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and trashed=false and '${rootId}' in parents`,
    fields: 'files(id,name)',
    pageSize: 100,
  });

  return (
    children.data.files?.map((file) => ({
      id: file.id!,
      name: file.name!,
      folderId: file.id!,
    })) || []
  );
}

export async function getDrive(accessToken: string) {
  const drive = await getDriveClient(accessToken);
  
  return drive;
}

export async function ensureDriveFolderPath(drive: any, parentId: string, folderPath: string) {
  const segments = folderPath
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);

  let currentParent = parentId;

  for (const segment of segments) {
    const escapedName = segment.replace(/'/g, "\\'");
    const existing = await drive.files.list({
      q: `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${currentParent}' in parents`,
      fields: 'files(id,name)',
      pageSize: 1,
    });

    const folderId = existing.data.files?.[0]?.id;
    if (folderId) {
      currentParent = folderId;
      continue;
    }

    const created = await drive.files.create({
      requestBody: {
        name: segment,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [currentParent],
      },
      fields: 'id',
    });

    currentParent = created.data.id!;
  }

  return currentParent;
}
