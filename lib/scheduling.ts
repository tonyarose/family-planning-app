import { google } from "googleapis";
import { getDriveClient, findFolderByName } from "./google-drive";

export type SchedulingRequest = {
  id: string;
  requestedBy: string;
  message: string;
  suggestedTimes: string[];
  status: "pending" | "approved" | "declined" | "alternative";
  confirmedTime: string;
  note: string;
  createdAt: string;
};

function getSheetsClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth });
}

async function findOrCreateSchedulingSheet(
  accessToken: string
): Promise<string> {
  const drive = getDriveClient(accessToken);
  const sharedFolderName =
    process.env.SHARED_DRIVE_FOLDER_NAME ?? "Family Planning";

  const rootId = await findFolderByName(accessToken, sharedFolderName);
  if (!rootId) throw new Error("Shared folder not found");

  let hpFolderId = await findFolderByName(
    accessToken,
    "House Projects",
    rootId
  );
  if (!hpFolderId) {
    const res = await drive.files.create({
      requestBody: {
        name: "House Projects",
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootId],
      },
      fields: "id",
    });
    hpFolderId = res.data.id!;
  }

  const existing = await drive.files.list({
    q: `'${hpFolderId}' in parents and name = 'Scheduling Requests' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
  });

  if (existing.data.files?.[0]?.id) return existing.data.files[0].id;

  const created = await drive.files.create({
    requestBody: {
      name: "Scheduling Requests",
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [hpFolderId],
    },
    fields: "id",
  });
  const sheetId = created.data.id!;

  const sheets = getSheetsClient(accessToken);
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Sheet1!A1:H1",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          "id",
          "requestedBy",
          "message",
          "suggestedTimes",
          "status",
          "confirmedTime",
          "note",
          "createdAt",
        ],
      ],
    },
  });

  return sheetId;
}

export async function getSchedulingRequests(
  accessToken: string
): Promise<SchedulingRequest[]> {
  const sheetId = await findOrCreateSchedulingSheet(accessToken);
  const sheets = getSheetsClient(accessToken);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Sheet1!A2:H",
  });

  const rows = res.data.values ?? [];
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? "",
      requestedBy: r[1] ?? "",
      message: r[2] ?? "",
      suggestedTimes: r[3] ? JSON.parse(r[3]) : [],
      status: (r[4] as SchedulingRequest["status"]) ?? "pending",
      confirmedTime: r[5] ?? "",
      note: r[6] ?? "",
      createdAt: r[7] ?? "",
    }));
}

export async function saveSchedulingRequest(
  accessToken: string,
  request: SchedulingRequest
): Promise<void> {
  const sheetId = await findOrCreateSchedulingSheet(accessToken);
  const sheets = getSheetsClient(accessToken);

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Sheet1!A2:A",
  });

  const rows = existing.data.values ?? [];
  const rowIndex = rows.findIndex((r) => r[0] === request.id);

  const values = [
    [
      request.id,
      request.requestedBy,
      request.message,
      JSON.stringify(request.suggestedTimes),
      request.status,
      request.confirmedTime,
      request.note,
      request.createdAt,
    ],
  ];

  if (rowIndex >= 0) {
    const sheetRow = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Sheet1!A${sheetRow}:H${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:H",
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }
}
