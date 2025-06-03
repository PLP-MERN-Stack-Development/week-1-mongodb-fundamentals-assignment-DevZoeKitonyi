// queries.js - MongoDB queries for plp_bookstore database
// Run these queries in MongoDB Shell (mongosh) after running insert_books.js

// Connect to the plp_bookstore database
use plp_bookstore;

print("=".repeat(60));
print("📚 PLP BOOKSTORE - MONGODB QUERIES");
print("=".repeat(60));

// ================================
// TASK 2: BASIC CRUD OPERATIONS
// ================================

print("\n🔍 TASK 2: BASIC CRUD OPERATIONS");
print("-".repeat(40));

// 1. Find all books in a specific genre (Fiction)
print("\n1. Find all Fiction books:");
db.books.find({ genre: "Fiction" }).forEach(book => {
  print(`   • ${book.title} by ${book.author} (${book.published_year}) - $${book.price}`);
});

// 2. Find books published after a certain year (1950)
print("\n2. Books published after 1950:");
db.books.find({ published_year: { $gt: 1950 } }).forEach(book => {
  print(`   • ${book.title} (${book.published_year}) by ${book.author}`);
});

// 3. Find books by a specific author (George Orwell)
print("\n3. Books by George Orwell:");
db.books.find({ author: "George Orwell" }).forEach(book => {
  print(`   • ${book.title} (${book.published_year}) - ${book.pages} pages`);
});

// 4. Update the price of a specific book
print("\n4. Updating price of 'The Great Gatsby' from $9.99 to $12.99:");
const updateResult = db.books.updateOne(
  { title: "The Great Gatsby" },
  { $set: { price: 12.99 } }
);
print(`   Modified ${updateResult.modifiedCount} document(s)`);

// Verify the update
const updatedBook = db.books.findOne({ title: "The Great Gatsby" });
print(`   New price: $${updatedBook.price}`);

// 5. Delete a book by its title (we'll add a temporary book first, then delete it)
print("\n5. Deleting a book by title:");
// First, add a temporary book
db.books.insertOne({
  title: "Temporary Test Book",
  author: "Test Author",
  genre: "Test Genre",
  published_year: 2023,
  price: 9.99,
  in_stock: true,
  pages: 100,
  publisher: "Test Publisher"
});
print("   Added temporary book for deletion test");

const deleteResult = db.books.deleteOne({ title: "Temporary Test Book" });
print(`   Deleted ${deleteResult.deletedCount} document(s)`);

// ================================
// TASK 3: ADVANCED QUERIES
// ================================

print("\n🔍 TASK 3: ADVANCED QUERIES");
print("-".repeat(40));

// 1. Find books that are both in stock and published after 2010
print("\n1. Books in stock AND published after 2010:");
db.books.find({ 
  in_stock: true, 
  published_year: { $gt: 2010 } 
}).forEach(book => {
  print(`   • ${book.title} by ${book.author} (${book.published_year})`);
});

// 2. Use projection to return only title, author, and price
print("\n2. Books with projection (title, author, price only):");
db.books.find({}, { title: 1, author: 1, price: 1, _id: 0 }).limit(7).forEach(book => {
  print(`   • "${book.title}" by ${book.author} - $${book.price}`);
});

print("\n   ... (showing first 7 books with projection)");

// 3. Sorting by price (ascending)
print("\n3. Books sorted by price (ascending - cheapest first):");
db.books.find({}, { title: 1, price: 1, _id: 0 }).sort({ price: 1 }).limit(6).forEach(book => {
  print(`   • ${book.title} - $${book.price}`);
});

// 4. Sorting by price (descending)
print("\n4. Books sorted by price (descending - most expensive first):");
db.books.find({}, { title: 1, price: 1, _id: 0 }).sort({ price: -1 }).limit(6).forEach(book => {
  print(`   • ${book.title} - $${book.price}`);
});

// 5. Pagination example (5 books per page)
print("\n5. Pagination Example - 5 books per page:");
print("   Page 1 (first 5 books):");
db.books.find({}, { title: 1, author: 1, _id: 0 }).limit(5).forEach((book, index) => {
  print(`   ${index + 1}. ${book.title} by ${book.author}`);
});

print("\n   Page 2 (next 5 books):");
db.books.find({}, { title: 1, author: 1, _id: 0 }).skip(5).limit(5).forEach((book, index) => {
  print(`   ${index + 6}. ${book.title} by ${book.author}`);
});

print("\n   Page 3 (remaining books):");
db.books.find({}, { title: 1, author: 1, _id: 0 }).skip(10).limit(5).forEach((book, index) => {
  print(`   ${index + 11}. ${book.title} by ${book.author}`);
});

// ================================
// TASK 4: AGGREGATION PIPELINE
// ================================

print("\n🔍 TASK 4: AGGREGATION PIPELINES");
print("-".repeat(40));

// 1. Calculate average price by genre
print("\n1. Average price by genre:");
db.books.aggregate([
  {
    $group: {
      _id: "$genre",
      avgPrice: { $avg: "$price" },
      bookCount: { $sum: 1 },
      minPrice: { $min: "$price" },
      maxPrice: { $max: "$price" }
    }
  },
  {
    $sort: { avgPrice: -1 }
  }
]).forEach(result => {
  print(`   • ${result._id}:`);
  print(`     - Average: $${result.avgPrice.toFixed(2)}`);
  print(`     - Books: ${result.bookCount}`);
  print(`     - Range: $${result.minPrice} - $${result.maxPrice}`);
});

// 2. Find author with most books
print("\n2. Authors ranked by number of books:");
db.books.aggregate([
  {
    $group: {
      _id: "$author",
      bookCount: { $sum: 1 },
      books: { $push: "$title" },
      totalPages: { $sum: "$pages" },
      avgPrice: { $avg: "$price" }
    }
  },
  {
    $sort: { bookCount: -1, totalPages: -1 }
  }
]).forEach(result => {
  print(`   • ${result._id}: ${result.bookCount} book(s)`);
  print(`     - Total pages: ${result.totalPages}`);
  print(`     - Avg price: $${result.avgPrice.toFixed(2)}`);
  result.books.forEach(book => print(`     - "${book}"`));
});

// 3. Group books by publication decade
print("\n3. Books grouped by publication decade:");
db.books.aggregate([
  {
    $addFields: {
      decade: {
        $concat: [
          { $toString: { $multiply: [{ $floor: { $divide: ["$published_year", 10] }}, 10] }},
          "s"
        ]
      }
    }
  },
  {
    $group: {
      _id: "$decade",
      count: { $sum: 1 },
      books: { $push: { title: "$title", year: "$published_year", author: "$author" }},
      avgPrice: { $avg: "$price" }
    }
  },
  {
    $sort: { _id: 1 }
  }
]).forEach(result => {
  print(`   • ${result._id}: ${result.count} book(s) - Avg price: $${result.avgPrice.toFixed(2)}`);
  result.books.forEach(book => print(`     - ${book.title} (${book.year}) by ${book.author}`));
});

// ================================
// TASK 5: INDEXING
// ================================

print("\n🔍 TASK 5: INDEXING");
print("-".repeat(40));

// 1. Create index on title field
print("\n1. Creating index on 'title' field:");
try {
  const titleIndexResult = db.books.createIndex({ title: 1 });
  print(`   ✅ Index created: ${titleIndexResult}`);
} catch (error) {
  print(`   ⚠️  Index may already exist: ${error.message}`);
}

// 2. Create compound index on author and published_year
print("\n2. Creating compound index on 'author' and 'published_year':");
try {
  const compoundIndexResult = db.books.createIndex({ author: 1, published_year: -1 });
  print(`   ✅ Compound index created: ${compoundIndexResult}`);
} catch (error) {
  print(`   ⚠️  Index may already exist: ${error.message}`);
}

// 3. List all indexes
print("\n3. Current indexes on books collection:");
db.books.getIndexes().forEach(index => {
  print(`   • ${index.name}: ${JSON.stringify(index.key)}`);
});

// 4. Performance comparison using explain()
print("\n4. Performance analysis with explain():");

print("\n   🔍 Title search performance:");
const titleExplain = db.books.find({ title: "The Great Gatsby" }).explain('executionStats');
print(`   • Execution time: ${titleExplain.executionStats.executionTimeMillis}ms`);
print(`   • Documents examined: ${titleExplain.executionStats.totalDocsExamined}`);
print(`   • Documents returned: ${titleExplain.executionStats.totalDocsReturned}`);
print(`   • Index used: ${titleExplain.executionStats.executionStages.indexName || 'COLLSCAN (no index)'}`);

print("\n   🔍 Compound index performance test:");
const compoundExplain = db.books.find({ author: "J.R.R. Tolkien", published_year: { $gte: 1950 } }).explain('executionStats');
print(`   • Execution time: ${compoundExplain.executionStats.executionTimeMillis}ms`);
print(`   • Documents examined: ${compoundExplain.executionStats.totalDocsExamined}`);
print(`   • Documents returned: ${compoundExplain.executionStats.totalDocsReturned}`);
print(`   • Index used: ${compoundExplain.executionStats.executionStages.indexName || 'COLLSCAN (no index)'}`);

// Performance test without index (on genre field which has no index)
print("\n   🔍 Query without index (genre field):");
const noIndexExplain = db.books.find({ genre: "Fiction" }).explain('executionStats');
print(`   • Execution time: ${noIndexExplain.executionStats.executionTimeMillis}ms`);
print(`   • Documents examined: ${noIndexExplain.executionStats.totalDocsExamined}`);
print(`   • Documents returned: ${noIndexExplain.executionStats.totalDocsReturned}`);
print(`   • Scan type: ${noIndexExplain.executionStats.executionStages.stage}`);

// ================================
// ADDITIONAL USEFUL QUERIES
// ================================

print("\n🔍 ADDITIONAL USEFUL QUERIES & STATISTICS");
print("-".repeat(40));

// 1. Collection statistics
print("\n1. Collection overview:");
const stats = db.books.aggregate([
  {
    $group: {
      _id: null,
      totalBooks: { $sum: 1 },
      avgPrice: { $avg: "$price" },
      avgPages: { $avg: "$pages" },
      inStockCount: { $sum: { $cond: ["$in_stock", 1, 0] }},
      outOfStockCount: { $sum: { $cond: ["$in_stock", 0, 1] }},
      oldestBook: { $min: "$published_year" },
      newestBook: { $max: "$published_year" },
      totalPages: { $sum: "$pages" },
      totalValue: { $sum: "$price" }
    }
  }
]).toArray()[0];

print(`   📊 Database Statistics:`);
print(`   • Total books: ${stats.totalBooks}`);
print(`   • Average price: $${stats.avgPrice.toFixed(2)}`);
print(`   • Average pages: ${Math.round(stats.avgPages)} pages`);
print(`   • Total pages: ${stats.totalPages.toLocaleString()} pages`);
print(`   • Total collection value: $${stats.totalValue.toFixed(2)}`);
print(`   • Books in stock: ${stats.inStockCount}`);
print(`   • Books out of stock: ${stats.outOfStockCount}`);
print(`   • Publication range: ${stats.oldestBook} - ${stats.newestBook}`);

// 2. Most expensive and cheapest books
print("\n2. Price extremes:");
const mostExpensive = db.books.findOne({}, { sort: { price: -1 }});
const cheapest = db.books.findOne({}, { sort: { price: 1 }});
print(`   💰 Most expensive: "${mostExpensive.title}" by ${mostExpensive.author} - $${mostExpensive.price}`);
print(`   💵 Cheapest: "${cheapest.title}" by ${cheapest.author} - $${cheapest.price}`);

// 3. Longest and shortest books
print("\n3. Book length extremes:");
const longest = db.books.findOne({}, { sort: { pages: -1 }});
const shortest = db.books.findOne({}, { sort: { pages: 1 }});
print(`   📖 Longest: "${longest.title}" - ${longest.pages} pages`);
print(`   📄 Shortest: "${shortest.title}" - ${shortest.pages} pages`);

// 4. Books by availability
print("\n4. Stock status breakdown:");
db.books.aggregate([
  {
    $group: {
      _id: "$in_stock",
      count: { $sum: 1 },
      books: { $push: "$title" }
    }
  }
]).forEach(result => {
  const status = result._id ? "📗 In Stock" : "📕 Out of Stock";
  print(`   ${status}: ${result.count} books`);
});

// 5. Genre diversity
print("\n5. Genre analysis:");
db.books.aggregate([
  {
    $group: {
      _id: "$genre",
      count: { $sum: 1 },
      avgPrice: { $avg: "$price" },
      avgPages: { $avg: "$pages" }
    }
  },
  {
    $sort: { count: -1 }
  }
]).forEach(result => {
  print(`   📚 ${result._id}: ${result.count} book(s)`);
  print(`       Avg price: $${result.avgPrice.toFixed(2)}, Avg pages: ${Math.round(result.avgPages)}`);
});

print("\n" + "=".repeat(60));
print("✅ All MongoDB queries completed successfully!");
print("📝 Total documents in collection: " + db.books.countDocuments());
print("🏃‍♂️ Performance optimized with strategic indexing");
print("=".repeat(60));
