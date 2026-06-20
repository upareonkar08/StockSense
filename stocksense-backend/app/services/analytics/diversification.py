from typing import Dict, List, Any

def calculate_hhi(weights: Dict[str, float]) -> float:
    """Calculate the Herfindahl-Hirschman Index (HHI) for portfolio concentration.
    
    HHI is calculated as the sum of squared weights: sum(w_i ^ 2) where w_i is the fractional weight (0.0 to 1.0).
    A lower HHI (closer to 0) implies high diversification.
    A higher HHI (closer to 1) implies high concentration.
    """
    if not weights:
        return 1.0
    
    total = sum(weights.values())
    if total == 0:
        return 1.0
        
    hhi = sum((w / total) ** 2 for w in weights.values())
    return hhi

def calculate_allocations(holdings_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate percentage allocations by sector, asset type, and ticker.
    
    Each element in holdings_data must have:
      - 'ticker': str
      - 'asset_type': str
      - 'sector': str (optional)
      - 'market_value': float
    """
    total_val = sum(h["market_value"] for h in holdings_data)
    if total_val <= 0:
        return {
            "sector_allocations": {},
            "asset_type_allocations": {},
            "ticker_weights": {},
            "hhi": 1.0
        }
        
    sectors = {}
    asset_types = {}
    tickers = {}
    
    for h in holdings_data:
        val = h["market_value"]
        weight = val / total_val
        
        # Ticker weights
        ticker = h["ticker"].upper()
        tickers[ticker] = weight
        
        # Sector allocation
        sector = h.get("sector") or "Unclassified"
        sectors[sector] = sectors.get(sector, 0.0) + weight
        
        # Asset type allocation
        at = h.get("asset_type")
        at_str = at.value if hasattr(at, "value") else str(at)
        asset_types[at_str] = asset_types.get(at_str, 0.0) + weight
        
    hhi_val = calculate_hhi(tickers)
    
    return {
        "sector_allocations": sectors,
        "asset_type_allocations": asset_types,
        "ticker_weights": tickers,
        "hhi": hhi_val
    }
