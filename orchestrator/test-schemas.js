// Test schemas import
console.log('Testing schemas import...');
try {
  const schemas = await import('../agents/schemas.ts');
  console.log('Available exports:', Object.keys(schemas));
  console.log('runConfigSchema:', schemas.runConfigSchema);
} catch (error) {
  console.error('Import error:', error.message);
}
