FROM node:20-slim
ARG TARGETPLATFORM
LABEL org.opencontainers.image.source="https://github.com/iotbyanurag/Latex-Resume" \
    org.opencontainers.image.description="TeX Live microservice (platform=${TARGETPLATFORM})"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       make \
       perl \
       latexmk \
       fontconfig \
       ghostscript \
       texlive-luatex \
       texlive-xetex \
       texlive-latex-base \
       texlive-latex-extra \
       texlive-latex-recommended \
       texlive-fonts-recommended \
       texlive-fonts-extra \
       texlive-plain-generic \
       lmodern \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY src ./src

EXPOSE 5001
CMD ["npm", "start"]