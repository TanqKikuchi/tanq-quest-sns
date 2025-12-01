module.exports = {
  env: {
    es2022: true,
    node: true
  },
  extends: ['standard'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'import/extensions': ['error', 'ignorePackages'],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
};
