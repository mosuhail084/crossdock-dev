// Generate Swagger or OpenAPI document
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  swaggerDefinition: {
      openapi: '3.0.0',
      info: {
          title: 'Fleet API',
          description: 'API Documentation'
      },
      components:{
        securitySchemes:{
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          }               
        }   
      },
      servers: [
          {
            url: "https://api-qbservice.azurewebsites.net/cms",
            description: "Dev Server"
          },
          {
            url: "http://localhost:3000/api",
            description: "Local Server"
          }     
      ],
  },
  apis: ['./routes/*.js']
}

const specs = swaggerJsDoc(swaggerOptions);

module.exports = function (app) {
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));
};