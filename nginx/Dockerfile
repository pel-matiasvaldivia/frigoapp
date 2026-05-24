FROM nginx:alpine

# Copy custom configuration
COPY nginx.conf /etc/nginx/nginx.conf

# We don't copy the uploads inside the image because they are a volume
# EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
