const { expect } = require('chai');
const detection = require('../');

describe('detection', () => {
  const ctx = {
    shellWrap: (x) => x,
    forkProc: (dir, cmd, args, cb) => cb(...args),
    workingDir: process.cwd(),
  };

  it('skips on file not found', (done) => {
    const rule = {
      filename: 'invalid/path/not/found',
      grep: /string\001not\001present/i,
      prepare: { cmd: '', args: [42] },
    };

    detection([rule], 'prepare', ctx, (code) => {
      expect(code).to.be.equal(0);
      done();
    });
  });

  it('supports exists predicate', (done) => {
    const rule = {
      exists: true,
      filename: 'package.json',
      prepare: { cmd: '', args: [42] },
    };

    detection([rule], 'prepare', ctx, (code) => {
      expect(code).to.be.equal(42);
      done();
    });
  });

  it('skips grep mismatch', (done) => {
    const rule = {
      filename: 'package.json',
      grep: /string\001not\001present/i,
      prepare: { cmd: '', args: [42] },
    };

    detection([rule], 'prepare', ctx, (code) => {
      expect(code).to.be.equal(0);
      done();
    });
  });

  it('supports grep predicate', (done) => {
    const rule = {
      filename: 'package.json',
      grep: /strider-detection-rules/i,
      prepare: { cmd: '', args: [42] },
    };

    detection([rule], 'prepare', ctx, (code) => {
      expect(code).to.be.equal(42);
      done();
    });
  });

  it('supports JSON predicate', (done) => {
    const rules = [{
      // skipped: rule without predicate
      filename: 'package.json',
      prepare: { cmd: '', args: [2] },
    }, {
      // skipped: cannot read directory
      filename: 'test',
      jsonKeyExists: 'dependencies.glob',
      prepare: { cmd: '', args: [4] },
    }, {
      filename: 'package.json',
      jsonKeyExists: 'dependencies.glob',
      prepare: { cmd: '', args: [4] },
    }, {
      // skipped: previous rule matches
      exists: true,
      filename: 'package.json',
      prepare: { cmd: '', args: [42] },
    }];

    detection(rules, 'prepare', ctx, (code) => {
      expect(code).to.be.equal(4);
      done();
    });
  });

  it('skips JSON mismatch', (done) => {
    const rule = {
      filename: 'package.json',
      jsonKeyExists: 'invalid.property.-',
      prepare: { cmd: '', args: [42] },
    };

    detection([rule], 'prepare', ctx, (code) => {
      expect(code).to.be.equal(0);
      done();
    });
  });

  it('skips invalid JSON', (done) => {
    const rule = {
      filename: 'LICENSE',
      jsonKeyExists: 'invalid.property.-',
      prepare: { cmd: '', args: [42] },
    };

    detection([rule], 'prepare', ctx, (code) => {
      expect(code).to.be.equal(0);
      done();
    });
  });

  it('skips inverse exists', (done) => {
    const rule = {
      filename: 'LICENSE',
      exists: false,
      prepare: { cmd: '', args: [42] },
    };

    detection([rule], 'prepare', ctx, (code) => {
      expect(code).to.be.equal(0);
      done();
    });
  });
});
