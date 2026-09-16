FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    tzdata \
    curl

RUN docker-php-ext-install pdo pdo_pgsql zip bcmath opcache

RUN apk add --no-cache $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

ENV TZ=Asia/Jakarta

WORKDIR /var/www/html
