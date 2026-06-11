FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nginx

# Clear cache
RUN apt-get clean && rm -rf /var/lib/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy existing application directory contents
COPY . /var/www

# Install dependencies via Composer
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Setup Nginx configuration
RUN echo 'server { \n\
    listen 80; \n\
    index index.php index.html; \n\
    error_log  /var/log/nginx/error.log; \n\
    access_log /var/log/nginx/access.log; \n\
    root /var/www/public; \n\
    location ~ \.php$ { \n\
        try_files $uri =404; \n\
        fastcgi_split_path_info ^(.+\.php)(/.+)$; \n\
        fastcgi_pass 127.0.0.1:9000; \n\
        fastcgi_index index.php; \n\
        include fastcgi_params; \n\
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name; \n\
        fastcgi_param PATH_INFO $fastcgi_path_info; \n\
    } \n\
    location / { \n\
        try_files $uri $uri/ /index.php?$query_string; \n\
        gzip_static on; \n\
    } \n\
}' > /etc/nginx/sites-available/default

# Expose port 80 and start nginx and php-fpm
EXPOSE 80
CMD php-fpm -D && nginx -g "daemon off;"