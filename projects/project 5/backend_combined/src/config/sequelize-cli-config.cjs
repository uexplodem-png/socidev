{
  "development": {
    "dialect": "sqlite",
    "storage": "src/db.sqlite",
    "logging": false
  },
  "test": {
    "dialect": "sqlite",
    "storage": ":memory:",
    "logging": false
  },
  "production": {
    "dialect": "sqlite",
    "storage": "src/db.sqlite",
    "logging": false
  }
}