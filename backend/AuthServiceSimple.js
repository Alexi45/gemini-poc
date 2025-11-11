console.log('AuthService loading...');

function getAuthServiceInstance() {
  console.log('getAuthServiceInstance called');
  return { test: true };
}

console.log('About to export...');

module.exports = {
  getAuthServiceInstance
};

console.log('Export completed');
