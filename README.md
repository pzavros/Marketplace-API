# Online Marketplace API

## Overview
This API was developed by Panayiotis Zavros for the Distributed Enterprise Systems module at UCLan Cyprus, part of the BSc in Computer Science. The API manages an online marketplace, handling products, categories, and user carts.

## Setup Instructions

Follow these instructions to get the API to run locally for development and testing purposes.

### Cloning the Repository
```bash
git clone https://github.com/pzavros/Marketplace-API
```

### Installing Dependencies
Navigate to the project directory and run:
```bash
npm install
```
### Database Initialization
Execute the database schema setup scripts to set up the required database tables.

## Running the Application

Start the server with:
```bash
npm start
```
Access the application via `http://localhost:3000/`.

## Testing

Import the Postman scripts provided in the `username_tests` folder to test the API endpoints.

## API Endpoints

Below is a list of available RESTful endpoints for managing the online marketplace. Each endpoint follows RESTful conventions and is described with its HTTP method, URI, and a brief description.

### Categories

- **Create Category**
  - `POST /api/category/create` - Creates a new category.
  
- **Delete Category**
  - `DELETE /api/category/delete` - Deletes a category by ID.

### Products

- **Create Product**
  - `POST /api/product/create` - Creates a new product.
  
- **Get Product**
  - `GET /api/product/{ID}` - Retrieves a product by ID.
  
- **List Products**
  - `GET /api/product/list` - Lists all products, with optional filters for category and price.
  
- **Update Product**
  - `PUT /api/product/update` - Updates an existing product.
  
- **Delete Product**
  - `DELETE /api/product/delete` - Deletes a product by ID.

### Users

- **Create User**
  - `POST /api/user/create` - Registers a new user along with a new cart.
  
- **Get User**
  - `GET /api/user/{ID}` - Retrieves a user's details by ID.
  
- **List Users**
  - `GET /api/user/list` - Lists all users.
  
- **Delete User**
  - `DELETE /api/user/delete` - Deletes a user by ID.

### Cart Operations

- **Add Product to Cart**
  - `POST /api/user/addToCart` - Adds a product to the user's cart.
  
- **Remove Product from Cart**
  - `DELETE /api/user/removeFromCart` - Removes a product from the user's cart.
  
- **Get User's Cart**
  - `GET /api/user/getCart` - Lists all items in a user's cart.

### Orders

- **Purchase Products**
  - `POST /api/user/purchase` - Processes the purchase of products in the user's cart.
  
- **List Orders**
  - `GET /api/order/list` - Lists all orders, with optional filters for user ID and product ID.

