import { App } from './app';

const port = parseInt(process.env.PORT) || 3000;
const app = new App();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
