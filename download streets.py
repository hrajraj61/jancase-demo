import osmnx as ox
import random
import json

# 1. Setup Coordinates (Hazaribagh)
coords = (23.9925, 85.3637)
radius = 2500 

print("Fetching street data and calculating luminosity attributes...")
G = ox.graph_from_point(coords, dist=radius, network_type='drive')

# 2. Assign Luminosity Factor (0.0 to 1.0)
random.seed(42)
for u, v, k, data in G.edges(data=True, keys=True):
    h_type = data.get('highway', 'residential')
    if isinstance(h_type, list): h_type = h_type[0]
    
    # Base Factor Logic
    base_ranks = {'primary': 1.0, 'secondary': 0.7, 'tertiary': 0.4, 'residential': 0.2}
    factor = base_ranks.get(h_type, 0.1)
    
    # Simulate "No Light" (0 factor) for specific conditions
    if factor < 0.5:
        # 30% chance of no light on small streets or dead ends
        if random.random() < 0.3 or G.degree(u) == 1 or G.degree(v) == 1:
            factor = 0.0
            
    data['luminosity'] = round(factor, 2)

# 3. Convert to GeoDataFrame
edges = ox.graph_to_gdfs(G, nodes=False)

# 4. Clean Data for GeoJSON compatibility
# OSM data often contains lists which break GeoJSON exports
for col in edges.columns:
    if edges[col].apply(lambda x: isinstance(x, list)).any():
        edges[col] = edges[col].astype(str)

# 5. Export to GeoJSON
output_filename = "hazaribagh_streets_luminosity.geojson"
edges.to_file(output_filename, driver='GeoJSON')

print(f"--- SUCCESS ---")
print(f"File saved: {output_filename}")
print(f"You can now import this file into any OpenStreetMap-based tool.")