// Stand-in Worker for the test pool (see vitest.config.ts): the tests call
// worker/service.ts directly and never send requests here.
export default {
  fetch: () => new Response("Not found", { status: 404 }),
} satisfies ExportedHandler<Env>;
