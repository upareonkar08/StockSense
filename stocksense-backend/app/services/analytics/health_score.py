def calculate_composite_health_score(
    hhi: float,
    sharpe_ratio: float,
    max_drawdown: float,
    sector_count: int
) -> int:
    """Calculate a composite portfolio health score from 0 to 100.
    
    Weights:
      - Sharpe Ratio (Risk-Adjusted Return): 35%
      - HHI Diversification (Concentration Risk): 25%
      - Max Drawdown (Downside Protection): 20%
      - Sector Exposure (Sector Diversification): 20%
    """
    # 1. Sharpe Score
    if sharpe_ratio >= 2.0:
        sharpe_score = 100.0
    elif sharpe_ratio <= 0.0:
        sharpe_score = 0.0
    else:
        sharpe_score = sharpe_ratio * 50.0  # Linear scaling from 0 to 2.0

    # 2. HHI Diversification Score (lower concentration is better)
    # HHI <= 0.1 gets 100 points. HHI >= 1.0 (single asset) gets 0 points.
    if hhi <= 0.1:
        hhi_score = 100.0
    elif hhi >= 1.0:
        hhi_score = 0.0
    else:
        hhi_score = 100.0 * (1.0 - (hhi - 0.1) / 0.9)

    # 3. Max Drawdown Score (lower absolute drawdown is better)
    # Drawdown <= 10% (0.10) gets 100 points. Drawdown >= 50% (0.50) gets 0 points.
    abs_dd = abs(max_drawdown)
    if abs_dd <= 0.1:
        dd_score = 100.0
    elif abs_dd >= 0.5:
        dd_score = 0.0
    else:
        dd_score = 100.0 * (1.0 - (abs_dd - 0.1) / 0.4)

    # 4. Sector Exposure Score
    # 5+ sectors gets 100 points, otherwise 20 points per sector.
    if sector_count >= 5:
        sector_score = 100.0
    elif sector_count <= 0:
        sector_score = 0.0
    else:
        sector_score = sector_count * 20.0

    composite = (
        0.35 * sharpe_score +
        0.25 * hhi_score +
        0.20 * dd_score +
        0.20 * sector_score
    )
    return max(0, min(100, int(round(composite))))
