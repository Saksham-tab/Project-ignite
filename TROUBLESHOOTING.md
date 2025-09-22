# Troubleshooting Guide

If you encounter issues with the application, try these solutions:

## Connection Problems

### API Connection Issues

If the frontend cannot connect to the backend:

1. Verify that backend is running on port 3001
2. Check that the frontend's `.env` file has `VITE_API_URL=http://localhost:3001/api`
3. Verify that CORS is properly configured in backend to allow requests from frontend
4. Try accessing the API directly in a browser or with a tool like Postman

### MongoDB Connection Issues

If the backend cannot connect to MongoDB:

1. Verify MongoDB is running (`mongodb://localhost:27017` for local instances)
2. Check the connection string in `backend/.env`
3. If using MongoDB Atlas, verify network access settings
4. Check that the user credentials in the connection string have proper access rights

## Authentication Issues

If login/signup is not working:

1. Check browser console for any error messages
2. Verify JWT_SECRET is properly set in `backend/.env`
3. Ensure backend is validating tokens correctly
4. Clear browser localStorage and try again

## Product Display Issues

If products are not showing up:

1. Verify that the products exist in the database
2. Check the network requests to see if the API is returning data
3. Inspect browser errors to identify any frontend rendering issues

## Order Processing Problems

If orders cannot be created:

1. Ensure user is authenticated
2. Check that all required fields are being sent in the request
3. Verify payment processing is working correctly
4. Check server logs for specific errors

## Performance Issues

If the application is slow:

1. Consider adding database indexes for frequently queried fields
2. Implement pagination for product listings
3. Optimize image sizes and implement lazy loading
4. Use server caching for frequently accessed data
5. Check for memory leaks in React components

## Building for Production

If you face issues when building for production:

1. Ensure all dependencies are installed (`npm run install:all`)
2. Check for TypeScript errors (`npm run build:backend` and `npm run build`)
3. Verify that environment variables are properly set for production
4. Test the built files before deployment
