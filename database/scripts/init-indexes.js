// Optionnel : mongosh mongodb://localhost:27017/sila database/scripts/init-indexes.js
db.users.createIndex({ email: 1 }, { unique: true });
db.categories.createIndex({ slug: 1 }, { unique: true });
db.coupons.createIndex({ code: 1 }, { unique: true });
db.carts.createIndex({ user_id: 1 }, { unique: true });
db.products.createIndex({ category: 1, price: 1 });
db.orders.createIndex({ customer_id: 1, created_at: -1 });
print("Index créés");
