/**
 * Measures server-side processing time for every request.
 *  - adds an  X-Response-Time: 3.42ms  header (visible in Postman -> Headers)
 *  - logs one line per request:  GET /api/tasks 200 3.42ms [HIT]
 * The [HIT]/[MISS] tag comes from the X-Cache header set by the controller.
 *
 * Postman's own "Time" field (what the lab asks you to record) is the full
 * round trip; this header is the server-only part - useful as a second source.
 */
module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();
  const elapsedMs = () => Number(process.hrtime.bigint() - start) / 1e6;

  const writeHead = res.writeHead;
  res.writeHead = function patchedWriteHead(...args) {
    if (!res.headersSent) res.setHeader('X-Response-Time', `${elapsedMs().toFixed(2)}ms`);
    return writeHead.apply(this, args);
  };

  res.on('finish', () => {
    if (process.env.NODE_ENV === 'test') return;
    const tag = res.getHeader('X-Cache');
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs().toFixed(2)}ms${tag ? ` [${tag}]` : ''}`
    );
  });
  next();
};
