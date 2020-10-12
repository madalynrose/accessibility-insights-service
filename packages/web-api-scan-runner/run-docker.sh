cp ../resource-deployment/runtime-config/runtime-config.dev.json ./dist/runtime-config.json
cp ./.env ./dist/
yarn build &&
    cd ./dist &&
    docker build --tag runner . &&
    docker run --init --cap-add=SYS_ADMIN --ipc=host runner
