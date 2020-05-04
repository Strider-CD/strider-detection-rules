const Promise = require('bluebird');
const debug = require('debug');
const glob = Promise.promisify(require('glob'));
const readFile = Promise.promisify(require('fs').readFile);
const path = require('path');

/**
 * Resolve property on context.
 */
function resolve(context, property) {
  return property.split('.')
    .reduce((result, key) => (result ? result[key] : undefined), context);
}

/**
 * Parse a file and return rule if it matches.
 * @param {string} file file name
 * @param {object} rule the rule to match
 */
function parseFile(file, rule) {
  return readFile(file, 'utf8')
    .then((data) => {
      let result;
      if (rule.grep && rule.grep.exec(data) !== null) {
        result = true;
      }
      if (result !== false && rule.jsonKeyExists) {
        try {
          result = resolve(JSON.parse(data), rule.jsonKeyExists) !== undefined;
        } catch (e) {
          result = false;
        }
      }
      return (result === true) ? rule : undefined;
    })
    .catch(() => undefined);
}

/**
 * Detect and run rule from a set of rules.
 * @param {object} rules list of detection rules
 * @param {string} phase which phase to run matches for (prepare, test, deploy, cleanup)
 * @param {object} ctx Strider worker plugin context
 * @param {function} cb callback function, takes exit code of rule command
 */
function detection(rules, phase, ctx, cb) {
  const baseDir = ctx.workingDir;

  const work = rules.map((rule) => glob(rule.filename, { cwd: baseDir })
    .then((matches) => {
      if (!matches.length) {
        return undefined;
      }
      if (rule.exists === false) {
        // Rule filename must not exist.
        throw Error(`exists: ${rule.filename}`);
      }
      if (rule.grep || rule.jsonKeyExists) {
        return parseFile(path.join(baseDir, matches[0]), rule);
      }
      if (rule.exists === true) {
        return rule;
      }
      return undefined;
    }));

  Promise.all(work)
    .then((results) => {
      // Find the first matched result.
      const result = results
        .find((item) => item !== undefined);
      if (!result) {
        throw new Error('no rules matched');
      }
      // Run the first matched result.
      const psh = ctx.shellWrap(result[phase]);
      ctx.forkProc(ctx.workingDir, psh.cmd, psh.args, cb);
    })
    .catch((failure) => {
      debug(failure);
      cb(0);
    });
}

module.exports = detection;
