Deno.serve(() => new Response(JSON.stringify({ error: "Alur undangan email sudah dinonaktifkan." }), {
  status: 410,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
}));
