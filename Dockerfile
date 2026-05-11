# Stage 1: Vite manifest + hashed assets (@vite في Blade لا يعمل بدون public/build).
FROM node:22-bookworm AS vite_assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libpng-dev \
    libpq-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd

RUN a2enmod rewrite

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

# Default php:apache vhost often ignores AllowOverride; Laravel needs it for public/.htaccess.
COPY deploy/apache-laravel.conf /etc/apache2/sites-available/000-default.conf
RUN sed -ri "s!/var/www/html!${APACHE_DOCUMENT_ROOT}!g" /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . /var/www/html
COPY --from=vite_assets /app/public/build ./public/build

RUN composer install --no-dev --optimize-autoloader \
    && mkdir -p storage/framework/{sessions,views,cache} \
    && php artisan storage:link 2>/dev/null || true \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

CMD ["apache2-foreground"]
