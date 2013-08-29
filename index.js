var gumshoe = require('gumshoe')

// *rules* - list of detection rules
// *phase* - which phase to run matches for (prepare, test, deploy, cleanup)
// *ctx* - Strider worker plugin context
// *cb* - callback function, takes
module.exports = function(rules, phase, ctx, cb) {

  // Note: we only run the first matched result.
  // There could be more, but we ignore them at the moment.
  gumshoe.run(ctx.workingDir, rules, function(err, result) {
      if (err) return cb(0)
      var psh = ctx.shellWrap(result[phase])
      ctx.forkProc(ctx.workingDir, psh.cmd, psh.args, function(code) {
        return cb(code)
      })
  })

}
