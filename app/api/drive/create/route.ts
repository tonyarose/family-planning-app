import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { findFolderByName, createGoogleDoc, createGoogleSheet, getDriveClient } from "@/lib/google-drive";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, title, type } = await req.json();
  if (!category || !title || !type) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const sharedFolderName = process.env.SHARED_DRIVE_FOLDER_NAME ?? "Family Planning";
  const rootFolderId = await findFolderByName(session.accessToken, sharedFolderName);
  if (!rootFolderId) {
    return NextResponse.json({ error: `Folder "${sharedFolderName}" not found in Drive` }, { status: 404 });
  }

  let categoryFolderId = await findFolderByName(session.accessToken, category, rootFolderId);

  if (!categoryFolderId) {
    const drive = getDriveClient(session.accessToken);
    const res = await drive.files.create({
      requestBody: {
        name: category,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootFolderId],
      },
      fields: "id",
    });
    categoryFolderId = res.data.id!;
  }

  const webViewLink =
    type === "sheet"
      ? await createGoogleSheet(session.accessToken, title, categoryFolderId)
      : await createGoogleDoc(session.accessToken, title, categoryFolderId);

  return NextResponse.json({ webViewLink });
}
