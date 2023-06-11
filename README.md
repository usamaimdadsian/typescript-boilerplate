# TypeScript Boilerplate

This TypeScript boilerplate provides a basic structure and setup for a TypeScript project, along with additional functionality similar to Laravel's artisan command-line tool. It includes features such as generating controllers, models, and routes to help you quickly scaffold your project.

## Getting Started

To get started with this TypeScript boilerplate, follow the steps below:

1. Clone the repository to your local machine:

   ```bash
   git clone https://github.com/usamaimdadsian/typescript-boilerplate.git
    ```

2. Install the required dependencies:
   
   ```bash
   cd typescript-boilerplate
   npm install
    ```
3. Build the project:

   ```bash
   npm build
    ```
4. Start the development server:
   
   ```bash
   npm start
    ```
    The server will start running at http://localhost:3000.

## Available Scripts
In the project directory, you can run the following scripts:

- `npm run build`: Builds the TypeScript source code into JavaScript files, which are placed in the dist directory.
- `npm run build:watch`: Builds the TypeScript source code and automatically restarts it whenever changes are detected in the source files.
- `npm start`: Starts the development server and automatically restarts it whenever changes are detected in the source files.
- `npm run make <name> -a`: Generates model, controller, validation, route, service and swagger configuration. Here is full options List. We can use any combination like `-mcv` to create model, controller and validation
    - `-a` or `--all`  to Create all files
    - `-m` or `--model` to create model
    - `-c` or `--controller` to create controller
    - `-r` or `--route` to create route
    - `-s` or `--service` to create service
    - `-v` or `--validation` to create validation


## Project Structure

The project structure follows a standard organization for a TypeScript project:
```
src/
  |-- components/   
  |-- config/       
  |-- middlewares/  
  |-- modules/
  |-- routes/
  |-- index.ts
dist/
package.json
```


## Contributing

Contributions are welcome! If you have any suggestions, bug reports, or feature requests, please open an issue on the GitHub repository or submit a pull request.