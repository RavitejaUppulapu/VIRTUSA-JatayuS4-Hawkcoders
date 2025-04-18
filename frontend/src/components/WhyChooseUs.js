import React from "react";
import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import {
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Support as SupportIcon,
} from "@mui/icons-material";

const WhyChooseUs = () => {
  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Advanced Security",
      description:
        "State-of-the-art security measures to protect your infrastructure and data.",
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Real-time Monitoring",
      description:
        "Instant alerts and monitoring for quick response to any issues.",
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Predictive Analytics",
      description:
        "AI-powered analytics to prevent failures before they occur.",
    },
    {
      icon: <SupportIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "24/7 Support",
      description:
        "Round-the-clock technical support for your critical systems.",
    },
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Why Choose Our Predictive Maintenance System?
      </Typography>
      <Typography variant="body1" paragraph>
        Our system provides comprehensive monitoring and maintenance solutions
        for your critical infrastructure.
      </Typography>
      <Grid container spacing={3} mt={2}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                {feature.icon}
                <Typography variant="h6" gutterBottom mt={2}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default WhyChooseUs;
