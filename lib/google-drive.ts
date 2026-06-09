import { google } from "googleapis";

export function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

export function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function findFolderByName(
  accessToken: string,
  folderName: string,
  parentId?: string
): Promise<string | null> {
  const drive = getDriveClient(accessToken);
  const query = [
    `name = '${folderName}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    parentId ? `'${parentId}' in parents` : "",
  ]
    .filter(Boolean)
    .join(" and ");

  const res = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    pageSize: 1,
  });

  return res.data.files?.[0]?.id ?? null;
}

export async function listFolderContents(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  const drive = getDriveClient(accessToken);
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, modifiedTime, webViewLink)",
    orderBy: "folder,name",
    pageSize: 100,
  });

  return (res.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    modifiedTime: f.modifiedTime ?? null,
    webViewLink: f.webViewLink ?? null,
    isFolder: f.mimeType === "application/vnd.google-apps.folder",
  }));
}

export async function getFolderName(
  accessToken: string,
  folderId: string
): Promise<string | null> {
  const drive = getDriveClient(accessToken);
  const res = await drive.files.get({ fileId: folderId, fields: "name" });
  return res.data.name ?? null;
}

export async function createGoogleDoc(
  accessToken: string,
  title: string,
  folderId: string
): Promise<string> {
  const drive = getDriveClient(accessToken);
  const res = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: "application/vnd.google-apps.document",
      parents: [folderId],
    },
    fields: "id, webViewLink",
  });
  return res.data.webViewLink!;
}

export async function createGoogleSheet(
  accessToken: string,
  title: string,
  folderId: string
): Promise<string> {
  const drive = getDriveClient(accessToken);
  const res = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [folderId],
    },
    fields: "id, webViewLink",
  });
  return res.data.webViewLink!;
}

export async function getUpcomingEvents(
  accessToken: string,
  keywords: string[],
  maxResults = 10
): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient(accessToken);

  // Fetch all user calendars
  const calListRes = await calendar.calendarList.list({ minAccessRole: "reader" });
  const calendarIds = (calListRes.data.items ?? []).map((c) => c.id!).filter(Boolean);

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(); // 6 months out

  // Fetch upcoming events from all calendars in parallel
  const allEventArrays = await Promise.all(
    calendarIds.map((calendarId) =>
      calendar.events
        .list({ calendarId, timeMin, timeMax, singleEvents: true, orderBy: "startTime", maxResults: 100 })
        .then((r) => r.data.items ?? [])
        .catch(() => [])
    )
  );

  const allEvents = allEventArrays.flat();
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  // Filter events that match any keyword as a whole word in title or description
  const matched = allEvents.filter((e) => {
    const text = `${e.summary ?? ""} ${e.description ?? ""}`.toLowerCase();
    const matchedKw = lowerKeywords.find((kw) => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${escaped}\\b`).test(text);
    });
    if (matchedKw) console.log(`[calendar match] "${e.summary}" matched keyword: "${matchedKw}"`);
    return !!matchedKw;
  });

  // Deduplicate by event id, sort by start time, cap results
  const seen = new Set<string>();
  const deduped = matched.filter((e) => {
    if (seen.has(e.id!)) return false;
    seen.add(e.id!);
    return true;
  });

  deduped.sort((a, b) => {
    const aTime = a.start?.dateTime ?? a.start?.date ?? "";
    const bTime = b.start?.dateTime ?? b.start?.date ?? "";
    return aTime.localeCompare(bTime);
  });

  return deduped.slice(0, maxResults).map((e) => ({
    id: e.id!,
    summary: e.summary ?? "Untitled",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
    htmlLink: e.htmlLink ?? null,
  }));
}

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  webViewLink: string | null;
  isFolder?: boolean;
};

export type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string | null;
  categorySlug?: string;
};
