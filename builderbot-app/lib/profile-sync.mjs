/**
 * How a business profile is written to public.profiles.
 *
 * The row's primary key is a generated id. One account is allowed one profile,
 * and that is enforced by a separate unique column, owner_id. The save sends
 * owner_id and does not send id.
 *
 * PostgREST treats an upsert as "insert, and on conflict of the primary key,
 * update" unless onConflict names another unique column. Without owner_id
 * here, the first save inserts a row. The second save inserts again, Postgres
 * assigns a new id, then the unique owner_id rule rejects it. PostgREST
 * returns that as HTTP 409, and the existing row is left unchanged.
 */
export function profileUpsertOptions() {
  return { onConflict: "owner_id" };
}
