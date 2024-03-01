const { Sequelize, DataTypes } = require('sequelize');

// Establish a connection to the database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/marketplace.db',
  logging: console.log,
});



// Define Models
// Create Category table
const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [0, 50] // Ensures the name is up to 50 characters long
    }
  }
}, {
  tableName: 'categories',
  timestamps: false
});

// Create Product table
const Product = sequelize.define('Product', {
  name: DataTypes.STRING,
  description: {
    type: DataTypes.STRING,
    defaultValue: "No product description"
  },
  price: DataTypes.DECIMAL(10, 2),
  stock: DataTypes.INTEGER,
  categoryId: DataTypes.INTEGER
}, {
  timestamps: false
});

// Create User table
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  accountBalance: {
    type: DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: false
});


// Define Cart model
const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  // Define an array to store product IDs
  productIds: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: []
  }
}, {
  timestamps: false
});

// Define association between User and Cart
User.hasOne(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });


// Initialize the express application
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());




// Category Routes
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json(categories);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Create Category
app.post('/api/categories/create', async (req, res) => {
  const { name } = req.body;
  if (!name || name.length > 50) {
    return res.status(422).json({ error: 'Invalid category name.' });
  }
  try {
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(409).json({ error: 'Category already exists.' });
    }
    const category = await Category.create({ name });
    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Category
app.delete('/api/categories/delete/:id', async (req, res) => {
  const id = req.params.id;

  // Check if the ID is valid and a positive integer
  if (!id || isNaN(id) || parseInt(id) < 1) {
    return res.status(422).json({ error: 'Invalid ID provided.' });
  }

  try {
    // Check if the category exists
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    // Delete the category
    await Category.destroy({
      where: { id }
    });
    res.status(200).send('OK');
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
});
// End of Category Routes




// Product Routes
app.post('/api/product/create', async (req, res) => {
  const { name, description = "No product description", price, stock, categoryId } = req.body;

  if (!name || !price || !stock || !categoryId) {
    return res.status(422).json({ error: 'Invalid or missing parameters' });
  }

  try {
    const categoryExists = await Category.findByPk(categoryId);
    if (!categoryExists) {
      return res.status(422).json({ error: 'Category does not exist' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      categoryId
    });

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ error: error.message || 'Error creating the product' });
  }

});

app.get('/api/product/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if id is a valid integer
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(422).json({ error: 'Invalid ID' });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error getting the product' });
  }
});

app.delete('/api/product/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ error: error.message || 'Error deleting the product' });
  }

});

app.get('/api/products/list', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: Category
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ error: error.message || 'Error listing the products' });
  }
});

app.put('/api/product/update/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, categoryId } = req.body;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (name) {
      product.name = name;
    }
    if (description) {
      product.description = description;
    }
    if (price) {
      product.price = price;
    }
    if (stock) {
      product.stock = stock;
    }
    if (categoryId) {
      product.categoryId = categoryId;
    }


    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error updating the product' });
  }
});
// End of Product Routes




// User Routes
// Create User
app.post('/api/user/create', async (req, res) => {
  const { username, accountBalance} = req.body;

  if (!username) {
    return res.status(422).json({ error: 'Invalid or missing parameters' });
  }
  
  try {
    const user = await User.create({
      username,
      accountBalance
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ error: error.message || 'Error creating the user' });
  }

});

// List Users
app.get('/api/user/list', async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error', error);
    res.status(422).json({ error: 'data items could not be retrieved. ' });
  }
});

// Get user by ID
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isNaN(id) || id <= 0 || id === '') {
      return res.status(422).json({ error: 'Invalid ID' });
    }
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error getting the user' });
  }
});

// Delete User
app.delete('/api/user/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isNaN(id) || id <= 0 || id === '') {
      return res.status(422).json({ error: 'Invalid ID' });
    }
    // const orders = await Order.findAll({
    //   where: {
    //     userId: id
    //   }
    // });
    // const carts = await Cart.findOne({
    //   where: {
    //     userId: id
    //   }
    // });

    // if (orders) {
    //   return res.status(422).json({
    //     error: 'User is referenced on Orders table'
    //   });
    // }
    // if (carts) {
    //   return res.status(422).json({
    //     error: 'User is referenced on Carts table'
    //   });
    // }

    const user = await User.destroy({
      where: {
        id
      }
    });
    if (user === 0) { // No user was deleted
      return res.status(404).send('User not found');
    }
    // Include logic here to also delete the user's cart if required
    return res.status(200).send('User Deleted successfully');
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error deleting the user' });
  }
});

// Get user's cart
app.get('/api/user/:userId/getCart', async (req, res) => {
  const { userId } = req.params;

  try {
    // Validate user ID
    if (isNaN(userId) || parseInt(userId) <= 0) {
      return res.status(422).json({ error: 'Invalid user ID' });
    }

    const user = await User.findByPk(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch the user's cart
    const cart = await user.getCart();

    // Check if cart exists
    if (!cart) {
      return res.status(422).json({ error: 'Cart not found' });
    }

    // Fetch product details for each product ID in the cart
    const products = await Promise.all(
      cart.productIds.map(async (productId) => await Product.findByPk(productId))
    );

    // Return response with cart details and product information
    return res.status(200).json({
      cartId: cart.id,
      userId: cart.userId,
      productIds: products.map((product) => product.id)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error retrieving cart' });
  }
});


// Add product to user's cart
app.post('/api/user/:userId/addToCart', async (req, res) => {
  const { userId, productId } = req.body;

  try {
    // Validate user ID and product ID
    if (isNaN(userId) || parseInt(userId) <= 0 || isNaN(productId) || parseInt(productId) <= 0) {
      return res.status(422).json({ error: 'Invalid user ID or product ID' });
    }

    const user = await User.findByPk(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const product = await Product.findByPk(productId);

    // Check if product exists
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Fetch the user's cart
    const cart = await user.getCart();

    // Check if cart exists
    if (!cart) {
      // Create a new cart if it doesn't exist
      const newCart = await Cart.create({ userId });
      cart = newCart;
    }

    // Check if product already exists in the cart
    if (cart.productIds.includes(productId)) {
      return res.status(422).json({ error: 'Product already exists in the cart' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error adding product to cart' });
  }
}
);






// start API server
app.listen(port, () => {
  console.log(`server listening at port 3000`)
  console.log(`Press Ctrl+C to exit...`)
});
