import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
  Analytics as AnalyticsIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  LocalHospital as HospitalIcon,
  DirectionsCar as CarIcon,
} from "@mui/icons-material";

const WhyChooseUs = () => {
  const features = [
    {
      title: "Advanced AI-Powered Predictions",
      description:
        "Our machine learning algorithms provide accurate failure predictions with 95%+ accuracy.",
      icon: <AnalyticsIcon color="primary" />,
    },
    {
      title: "Real-time Monitoring",
      description:
        "24/7 monitoring of all critical systems with instant alert notifications.",
      icon: <SpeedIcon color="primary" />,
    },
    {
      title: "Comprehensive Analytics",
      description:
        "Detailed reports and insights to optimize maintenance schedules and reduce costs.",
      icon: <TrendingUpIcon color="primary" />,
    },
    {
      title: "Expert Support",
      description:
        "Round-the-clock technical support from certified maintenance professionals.",
      icon: <SupportIcon color="primary" />,
    },
    {
      title: "Cost Reduction",
      description:
        "Reduce maintenance costs by up to 40% through predictive maintenance strategies.",
      icon: <CheckCircleIcon color="primary" />,
    },
    {
      title: "Enhanced Security",
      description:
        "Enterprise-grade security with encrypted data transmission and secure cloud storage.",
      icon: <SecurityIcon color="primary" />,
    },
  ];

  const industryBenefits = {
    manufacturing: {
      title: "Manufacturing",
      benefits: [
        "Prevent production line downtime",
        "Optimize equipment lifespan",
        "Reduce maintenance costs",
        "Improve product quality",
      ],
      icon: <BuildIcon />,
    },
    energy: {
      title: "Energy & Utilities",
      benefits: [
        "Prevent power outages",
        "Optimize energy efficiency",
        "Ensure regulatory compliance",
        "Reduce environmental impact",
      ],
      icon: <WarningIcon />,
    },
    healthcare: {
      title: "Healthcare",
      benefits: [
        "Ensure medical equipment reliability",
        "Maintain patient safety",
        "Comply with healthcare regulations",
        "Reduce equipment downtime",
      ],
      icon: <HospitalIcon />,
    },
    transportation: {
      title: "Transportation",
      benefits: [
        "Prevent vehicle breakdowns",
        "Optimize fleet maintenance",
        "Ensure passenger safety",
        "Reduce fuel consumption",
      ],
      icon: <CarIcon />,
    },
  };

  const testimonials = [
    {
      name: "John Smith",
      role: "Maintenance Manager",
      company: "TechCorp Industries",
      quote:
        "This platform has revolutionized our maintenance operations. We've reduced downtime by 60% and saved over $500K annually.",
    },
    {
      name: "Sarah Johnson",
      role: "Operations Director",
      company: "PowerGrid Solutions",
      quote:
        "The predictive capabilities are incredible. We can now prevent issues before they become problems.",
    },
    {
      name: "Mike Chen",
      role: "Facility Manager",
      company: "Healthcare Plus",
      quote:
        "Reliability is critical in healthcare. This system ensures our equipment is always operational when needed.",
    },
  ];

  return (
    <Box p={3} data-testid="why-choose-us-content">
      <Typography variant="h3" gutterBottom align="center" color="primary">
        Why Choose Our Predictive Maintenance Platform?
      </Typography>

      <Typography variant="h6" align="center" color="text.secondary" paragraph>
        Transform your maintenance operations with cutting-edge AI technology
        and proven results
      </Typography>

      {/* Features Section */}
      <Box mt={6} data-testid="features-section">
        <Typography variant="h4" gutterBottom align="center">
          Features
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card sx={{ height: "100%", p: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    {feature.icon}
                    <Typography variant="h6" ml={1}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Industry Benefits Section */}
      <Box mt={8} data-testid="industry-benefits">
        <Typography variant="h4" gutterBottom align="center">
          Industry-Specific Benefits
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(industryBenefits).map(([key, industry]) => (
            <Grid item xs={12} md={6} key={key}>
              <Paper sx={{ p: 3, height: "100%" }}>
                <Box display="flex" alignItems="center" mb={2}>
                  {industry.icon}
                  <Typography variant="h6" ml={1}>
                    {industry.title}
                  </Typography>
                </Box>
                <List dense>
                  {industry.benefits.map((benefit, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={benefit} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Testimonials Section */}
      <Box mt={8} data-testid="testimonials">
        <Typography variant="h4" gutterBottom align="center">
          What Our Clients Say
        </Typography>
        <Grid container spacing={3}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: "100%", p: 2 }}>
                <CardContent>
                  <Typography
                    variant="body1"
                    paragraph
                    sx={{ fontStyle: "italic" }}
                  >
                    "{testimonial.quote}"
                  </Typography>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.role}
                    </Typography>
                    <Chip
                      label={testimonial.company}
                      size="small"
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Call to Action */}
      <Box mt={8} textAlign="center">
        <Paper sx={{ p: 4, bgcolor: "primary.main", color: "white" }}>
          <Typography variant="h5" gutterBottom>
            Ready to Transform Your Maintenance Operations?
          </Typography>
          <Typography variant="body1" paragraph>
            Join hundreds of companies that have already revolutionized their
            maintenance with our platform.
          </Typography>
          <Chip
            label="Get Started Today"
            color="secondary"
            sx={{ fontSize: "1.1rem", p: 1 }}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default WhyChooseUs;
