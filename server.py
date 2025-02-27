from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
from urllib.parse import parse_qs, urlparse

# Base directory for materials
MATERIALS_DIR = os.path.join(os.getcwd(), 'materials')

class MaterialsHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        print(f"Received request for: {self.path}")
        
        # Parse the URL
        parsed_path = urlparse(self.path)
        
        # Handle API requests for listing files in a category
        if parsed_path.path.startswith('/list-files/'):
            category = parsed_path.path.split('/list-files/')[-1]
            self.handle_list_files_request(category)
            return
        
        # Handle regular file requests
        return super().do_GET()

    def handle_list_files_request(self, category):
        print(f"Listing files for category: {category}")
        
        # Path to the category directory
        category_dir = os.path.join(MATERIALS_DIR, category)
        
        # Check if the directory exists
        if not os.path.exists(category_dir):
            print(f"Category directory not found: {category_dir}")
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': f'Category not found: {category}'}).encode())
            return
        
        try:
            # Get list of files in the category directory
            files = os.listdir(category_dir)
            file_list = [
                {
                    'name': f,
                    'path': f'/materials/{category}/{f}'
                }
                for f in files
                if os.path.isfile(os.path.join(category_dir, f))
            ]
            
            print(f"Found {len(file_list)} files in category {category}")
            
            # Send the response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(file_list).encode())
            
        except Exception as e:
            print(f"Error listing files: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

def run_server():
    # Check if materials directory exists
    if not os.path.exists(MATERIALS_DIR):
        print(f"Warning: Materials directory not found: {MATERIALS_DIR}")
        print("Creating materials directory...")
        os.makedirs(MATERIALS_DIR)
    
    # List available categories
    categories = [d for d in os.listdir(MATERIALS_DIR) 
                 if os.path.isdir(os.path.join(MATERIALS_DIR, d))]
    
    print(f"Available categories: {', '.join(categories) if categories else 'None'}")
    print(f"Materials directory path: {MATERIALS_DIR}")
    
    # Start the server
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, MaterialsHandler)
    print(f'Server running on port {port}...')
    print(f'Access the website at http://localhost:{port}')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
