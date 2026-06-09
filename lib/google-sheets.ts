import { google } from "googleapis";
import { getDriveClient, findFolderByName } from "./google-drive";

export type SheetTask = {
  id: string;
  text: string;
  done: boolean;
};

function getSheetsClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth });
}

async function findOrCreateTasksSheet(
  accessToken: string,
  categoryFolderId: string
): Promise<string> {
  const drive = getDriveClient(accessToken);

  // Look for existing Tasks sheet in the folder
  const res = await drive.files.list({
    q: `'${categoryFolderId}' in parents and name = 'Tasks' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
  });

  if (res.data.files?.[0]?.id) {
    return res.data.files[0].id;
  }

  // Create it
  const created = await drive.files.create({
    requestBody: {
      name: "Tasks",
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [categoryFolderId],
    },
    fields: "id",
  });

  const sheetId = created.data.id!;

  // Add header row
  const sheets = getSheetsClient(accessToken);
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Sheet1!A1:C1",
    valueInputOption: "RAW",
    requestBody: { values: [["id", "text", "done"]] },
  });

  return sheetId;
}

async function getCategoryFolderId(
  accessToken: string,
  categoryName: string
): Promise<string | null> {
  const sharedFolderName = process.env.SHARED_DRIVE_FOLDER_NAME ?? "Family Planning";
  const rootId = await findFolderByName(accessToken, sharedFolderName);
  if (!rootId) return null;

  let categoryId = await findFolderByName(accessToken, categoryName, rootId);
  if (!categoryId) {
    const drive = getDriveClient(accessToken);
    const res = await drive.files.create({
      requestBody: {
        name: categoryName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootId],
      },
      fields: "id",
    });
    categoryId = res.data.id!;
  }
  return categoryId;
}

export async function getTasks(
  accessToken: string,
  categoryName: string
): Promise<SheetTask[]> {
  const folderId = await getCategoryFolderId(accessToken, categoryName);
  if (!folderId) return [];

  const sheetId = await findOrCreateTasksSheet(accessToken, folderId);
  const sheets = getSheetsClient(accessToken);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Sheet1!A2:C",
  });

  const rows = res.data.values ?? [];
  return rows
    .filter((r) => r[0] && r[1])
    .map((r) => ({
      id: r[0],
      text: r[1],
      done: r[2] === "TRUE",
    }));
}

export async function saveTasks(
  accessToken: string,
  categoryName: string,
  tasks: SheetTask[]
): Promise<void> {
  const folderId = await getCategoryFolderId(accessToken, categoryName);
  if (!folderId) return;

  const sheetId = await findOrCreateTasksSheet(accessToken, folderId);
  const sheets = getSheetsClient(accessToken);

  // Clear existing task rows (keep header)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: "Sheet1!A2:C",
  });

  if (tasks.length === 0) return;

  // Write all tasks
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Sheet1!A2:C",
    valueInputOption: "RAW",
    requestBody: {
      values: tasks.map((t) => [t.id, t.text, t.done ? "TRUE" : "FALSE"]),
    },
  });
}
