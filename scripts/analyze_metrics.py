import sys
import json
import re

def parse_financial_metrics(text):
    """
    A simple NLP parser to extract numbers like revenue growth (%), gross margins (%), 
    and general positive/negative sentiment keyword frequencies.
    """
    metrics = {
        "growth_rates": [],
        "margins": [],
        "risk_keywords_count": 0,
        "growth_keywords_count": 0
    }
    
    if not text:
        return metrics

    # Extract percentages (e.g. "18% YoY", "up 12%", "margins of 74%")
    percent_matches = re.findall(r'(\d+(?:\.\d+)?)\s*%', text)
    for match in percent_matches:
        val = float(match)
        if val > 50: # Likely margin
            metrics["margins"].append(val)
        else: # Likely growth rate
            metrics["growth_rates"].append(val)

    # Simple keyword counts for sentiment proxy
    risk_words = ["risk", "headwind", "controversy", "lawsuit", "antitrust", "debt", "scrutiny", "decline", "slowdown", "soften"]
    growth_words = ["growth", "increase", "expand", "record", "exceed", "leader", "moat", "pipeline", "acceleration", "gain"]

    text_lower = text.lower()
    for word in risk_words:
        metrics["risk_keywords_count"] += text_lower.count(word)
    for word in growth_words:
        metrics["growth_keywords_count"] += text_lower.count(word)

    return metrics

def calculate_safety_score(payload):
    """
    Performs custom weighted quantitative calculations to derive the AntiGravity Safety Score.
    """
    horizon = payload.get("strategyHorizon", "Medium-Term") # Short-Term, Medium-Term, Long-Term
    risk_profile = payload.get("strategyRisk", "Balanced")   # Conservative, Balanced, Aggressive
    
    # Weightings (default to equal if not provided)
    w_rev = float(payload.get("revenueWeight", 33.3))
    w_risk = float(payload.get("riskWeight", 33.3))
    w_sent = float(payload.get("sentimentWeight", 33.4))

    # Parse inputs
    rev_metrics = parse_financial_metrics(payload.get("revenueGrowthAnalysis", ""))
    risk_metrics = parse_financial_metrics(payload.get("risksAnalysis", ""))
    sent_metrics = parse_financial_metrics(payload.get("sentimentCompetitorsAnalysis", ""))

    # 1. Calculate Revenue Score (Base: 70)
    rev_growth = sum(rev_metrics["growth_rates"]) / len(rev_metrics["growth_rates"]) if rev_metrics["growth_rates"] else 12.0
    rev_margin = sum(rev_metrics["margins"]) / len(rev_metrics["margins"]) if rev_metrics["margins"] else 30.0
    
    rev_score = 65.0
    # Growth bonuses
    if rev_growth > 20: rev_score += 15
    elif rev_growth > 10: rev_score += 10
    else: rev_score += 5
    # Margin bonuses
    if rev_margin > 40: rev_score += 15
    elif rev_margin > 25: rev_score += 10
    else: rev_score += 5
    
    rev_score = min(100.0, max(0.0, rev_score))

    # 2. Calculate Risk Score (Base: 80, penalize for risk keywords found)
    risk_count = risk_metrics["risk_keywords_count"]
    risk_score = 90.0
    
    # Penalize based on risk tolerance profile
    penalty_multiplier = 1.0
    if risk_profile == "Conservative":
        penalty_multiplier = 2.5 # High sensitivity to risk
    elif risk_profile == "Balanced":
        penalty_multiplier = 1.5
    else:
        penalty_multiplier = 0.5 # High risk tolerance, low penalty

    risk_score -= (risk_count * 2.0 * penalty_multiplier)
    
    # Risk horizon adjustment
    if horizon == "Long-Term" and risk_count > 8:
        risk_score -= 10.0 # Long term horizons are penalized more for massive risk counts
        
    risk_score = min(100.0, max(0.0, risk_score))

    # 3. Calculate Sentiment/Market Score (Base: 70)
    pos_sentiment = sent_metrics["growth_keywords_count"]
    neg_sentiment = sent_metrics["risk_keywords_count"]
    
    total_sentiment = pos_sentiment + neg_sentiment
    sentiment_ratio = pos_sentiment / total_sentiment if total_sentiment > 0 else 0.7
    
    sent_score = 50.0 + (sentiment_ratio * 40.0)
    
    # Speculative adjustments for Aggressive profile
    if risk_profile == "Aggressive" and pos_sentiment > 10:
        sent_score += 10.0
        
    sent_score = min(100.0, max(0.0, sent_score))

    # Weighted calculation
    final_score = (rev_score * w_rev + risk_score * w_risk + sent_score * w_sent) / (w_rev + w_risk + w_sent)
    
    return {
        "safetyScore": int(round(final_score)),
        "breakdown": {
            "revenueScore": int(round(rev_score)),
            "riskScore": int(round(risk_score)),
            "sentimentScore": int(round(sent_score)),
            "parsedGrowthRateAvg": round(rev_growth, 2),
            "parsedMarginAvg": round(rev_margin, 2),
            "detectedRisksCount": risk_count
        }
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input payload provided"}))
        sys.exit(1)
        
    try:
        input_data = json.loads(sys.argv[1])
        results = calculate_safety_score(input_data)
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
