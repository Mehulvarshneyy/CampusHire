export async function createNotification(client, { userId, title, message, link }) {
  await client.query(
    `INSERT INTO notifications (user_id, title, message, link)
     VALUES ($1, $2, $3, $4)`,
    [userId, title, message, link || null]
  );
}
