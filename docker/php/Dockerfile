FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    postgresql-dev \
    postgresql-client \
    libzip-dev \
    zip \
    unzip \
    git \
    tzdata \
    curl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN docker-php-ext-install pdo pdo_pgsql zip bcmath opcache

RUN apk add --no-cache $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

ENV TZ=Asia/Jakarta

# Runtime tuning, baked in so production images (no bind mount) get the same
# opcache/FPM behaviour as the local compose setup.
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/zz-opcache.ini
COPY docker/php/php-fpm.d/zz-kasirsewa.conf /usr/local/etc/php-fpm.d/zz-kasirsewa.conf

WORKDIR /var/www/html
