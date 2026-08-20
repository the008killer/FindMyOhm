class ResistorDecoder:

    DIGIT = {
        "black": 0,
        "brown": 1,
        "red": 2,
        "orange": 3,
        "yellow": 4,
        "green": 5,
        "blue": 6,
        "violet": 7,
        "gray": 8,
        "white": 9,
    }

    MULTIPLIER = {
        "silver": 0.01,
        "gold": 0.1,
        "black": 1,
        "brown": 10,
        "red": 100,
        "orange": 1_000,
        "yellow": 10_000,
        "green": 100_000,
        "blue": 1_000_000,
        "violet": 10_000_000,
        "gray": 100_000_000,
        "white": 1_000_000_000,
    }

    TOLERANCE = {
        "brown": 1,
        "red": 2,
        "green": 0.5,
        "blue": 0.25,
        "violet": 0.1,
        "gray": 0.05,
        "gold": 5,
        "silver": 10,
    }

    @staticmethod
    def format_ohms(ohms):
        """Converts raw Ohms into formatted string (e.g., 4.70 kΩ)"""
        if ohms >= 1e9:
            return f"{ohms/1e9:.2f} GΩ"
        if ohms >= 1e6:
            return f"{ohms/1e6:.2f} MΩ"
        if ohms >= 1e3:
            return f"{ohms/1e3:.2f} kΩ"
        return f"{ohms:.2f} Ω"

    def decode(self, colors):
        """
        Decodes a list of color band strings (4, 5, or 6 bands).
        """
        if not colors:
            return {"error": "No bands detected"}

        colors = [c.lower() for c in colors]
        n = len(colors)

        # Direction Heuristic: Gold/Silver tolerance band should be at the END.
        # If it's detected at index 0, reverse the list.
        if colors[0] in ["gold", "silver"]:
            colors = colors[::-1]

        try:
            if n == 4:
                val = (
                    10 * self.DIGIT[colors[0]] + self.DIGIT[colors[1]]
                ) * self.MULTIPLIER[colors[2]]
                tol = self.TOLERANCE.get(colors[3], "?")
            elif n in [5, 6]:
                val = (
                    100 * self.DIGIT[colors[0]]
                    + 10 * self.DIGIT[colors[1]]
                    + self.DIGIT[colors[2]]
                ) * self.MULTIPLIER[colors[3]]
                tol = self.TOLERANCE.get(colors[4], "?")
            else:
                return {
                    "error": f"Expected 3-6 bands, got {n}",
                    "colors": colors,
                }

            return {
                "ohms": val,
                "formatted": self.format_ohms(val),
                "tolerance": f"±{tol}%",
                "colors": colors,
            }

        except KeyError as e:
            return {
                "error": f"Invalid/misplaced color: {e}",
                "colors": colors,
            }