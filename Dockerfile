# استخدم نسخة PHP رسمية مع Apache
FROM php:8.2-apache

# تثبيت الإضافات الضرورية لـ Laravel و PostgreSQL (Supabase)
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libpq-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl

# تنظيف الكاش
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# تثبيت إضافات PHP
RUN docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd

# تفعيل موديل Rewrite في Apache (ضروري لروابط Laravel)
RUN a2enmod rewrite

# ضبط المجلد الرئيسي لـ Apache ليشير إلى مجلد public في Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# تثبيت Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# نسخ ملفات المشروع
COPY . /var/www/html

# تثبيت مكتبات Composer
RUN composer install --no-dev --optimize-autoloader

# إعطاء الصلاحيات لمجلدات Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# المنفذ الافتراضي لـ Render
EXPOSE 80

# أمر التشغيل
CMD ["apache2-foreground"]