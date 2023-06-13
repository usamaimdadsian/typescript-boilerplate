import { App } from './app';
import config from './config/config';

const port = config.port || 3000;
const app = new App();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
