# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
FROM node:12-slim

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 libxtst6 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install xvfb
RUN apt-get update && apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
    libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
    libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget x11vnc \
    x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps xvfb

# Install chromium missing packages from puppeteer bundle
# RUN apt-get update \
#     && apt-get install -y libgtk-3-0 libasound2 libgbm1 libdrm2 libatk-bridge2.0-0 libnss3 libgtk2.0-0 \
#     libxdamage1 libxcursor1 libxcomposite1 libxcb-dri3-0 libx11-xcb1 libxss1 libxtst6

# Install app dependencies
COPY package.json .

# Disable puppeteer to install chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm install \
    # Force npm package resolution
    && npx npm-force-resolutions \
    && npm install \
    # Add user so we don't need --no-sandbox.
    # same layer as npm install to keep re-chowned files from using up several hundred MBs more space
    && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /node_modules

# Run everything after as non-privileged user.
# USER pptruser

# Bundle app source
COPY . .

# Run with xvfb display buffer
CMD xvfb-run -a --server-args="-screen 0 1920x1080x24 -ac -nolisten tcp -dpi 96 +extension RANDR" node ./web-api-scan-runner.js
