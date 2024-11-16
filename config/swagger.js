// Generate Swagger or OpenAPI document
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

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
            url: "https://crossdock-dev.vercel.app/api",
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
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs, { customCssUrl: CSS_URL }));
};