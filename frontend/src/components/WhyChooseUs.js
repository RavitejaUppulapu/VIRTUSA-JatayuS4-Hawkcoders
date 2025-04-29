import React from "react";
import { Box, Typography, Grid, Card, CardContent, Container, Divider, Paper } from "@mui/material";
import {
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Support as SupportIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  IntegrationInstructions as IntegrationIcon,
  Nature as NatureIcon,
  VerifiedUser as VerifiedUserIcon,
  Build as BuildIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Storage as StorageIcon,
  CloudQueue as CloudIcon,
  DevicesOther as DevicesIcon,
} from "@mui/icons-material";

const WhyChooseUs = () => {
  const features = [
    // {
    //   icon: <SecurityIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    //   title: "Advanced Security",
    //   description:
    //     "Enterprise-grade security with end-to-end encryption, role-based access control, and compliance with industry standards like ISO 27001 and SOC 2.",
    // },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Real-time Monitoring",
      description:
        "Instant alerts and 24/7 monitoring with sub-second response times, enabling proactive maintenance and rapid issue resolution.",
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "AI-Powered Analytics",
      description:
        "Advanced machine learning algorithms predict failures before they occur, with 95% accuracy in failure prediction and root cause analysis.",
    },
    // {
    //   icon: <SupportIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    //   title: "24/7 Expert Support",
    //   description:
    //     "Round-the-clock technical support with dedicated account managers and certified maintenance experts at your service.",
    // },
    {
      icon: <MonetizationOnIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Cost Optimization",
      description:
        "Reduce maintenance costs by up to 30% through predictive maintenance and optimized resource allocation.",
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Scalable Solution",
      description:
        "Seamlessly scale from single-site to multi-site operations with our cloud-native architecture.",
    },
    {
      icon: <IntegrationIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Seamless Integration",
      description:
        "Pre-built integrations with major ERP, CMMS, and IoT platforms, including SAP, Oracle, and Siemens.",
    },
    {
      icon: <NatureIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Sustainability",
      description:
        "Reduce energy consumption by up to 25% and extend equipment lifespan through optimized maintenance schedules.",
    },
    // {
    //   icon: <VerifiedUserIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    //   title: "Compliance Ready",
    //   description:
    //     "Built-in compliance with ISO 55000, IEC 62443, and industry-specific regulations for manufacturing and utilities.",
    // },
    {
      icon: <BuildIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Customizable Workflows",
      description:
        "Tailor maintenance workflows, alerts, and reports to match your specific business processes and requirements.",
    },
    {
      icon: <AssessmentIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Advanced Analytics",
      description:
        "Comprehensive dashboards and reports with drill-down capabilities for deep insights into equipment performance.",
    },
    {
      icon: <TimelineIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Predictive Timeline",
      description:
        "Visual timeline of predicted maintenance needs and resource requirements for better planning and budgeting.",
    },
  ];

  const industryBenefits = [
    {
      title: "Manufacturing",
      benefits: [
        "Reduce unplanned downtime by up to 45%",
        "Optimize production line efficiency",
        "Extend equipment lifespan",
        "Improve quality control"
      ]
    },
    {
      title: "Energy & Utilities",
      benefits: [
        "Prevent critical infrastructure failures",
        "Optimize power generation efficiency",
        "Reduce maintenance costs",
        "Ensure regulatory compliance"
      ]
    },
    {
      title: "Healthcare",
      benefits: [
        "Ensure medical equipment reliability",
        "Maintain critical life support systems",
        "Comply with healthcare regulations",
        "Optimize facility management"
      ]
    },
    {
      title: "Transportation",
      benefits: [
        "Prevent fleet breakdowns",
        "Optimize maintenance schedules",
        "Reduce operational costs",
        "Improve safety compliance"
      ]
    }
  ];

  const businessImpact = [
    {
      metric: "30%",
      title: "Reduction in Unplanned Downtime",
      description: "Our clients have seen significant improvements in equipment uptime and reliability."
    },
    {
      metric: "25%",
      title: "Lower Maintenance Costs",
      description: "Predictive scheduling and resource optimization reduce unnecessary maintenance spend."
    },
    {
      metric: "12 Months",
      title: "Average ROI Period",
      description: "Most customers achieve a full return on investment within the first year."
    },
    {
      metric: "95%",
      title: "Prediction Accuracy",
      description: "Our AI models achieve high accuracy in predicting potential failures."
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box py={6}>
        <Typography variant="h3" gutterBottom align="center" color="primary">
          Why Choose Our Predictive Maintenance Platform?
        </Typography>
        <Typography variant="h6" paragraph align="center" color="text.secondary">
          Transform your maintenance operations with our industry-leading AI-powered solution
        </Typography>

        {/* Features Grid */}
        <Grid container spacing={3} mt={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: "center", p: 3 }}>
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

        {/* Industry Benefits */}
        <Box mt={8}>
          <Typography variant="h4" gutterBottom align="center">
            Industry-Specific Benefits
          </Typography>
          <Grid container spacing={3} mt={2}>
            {industryBenefits.map((industry, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {industry.title}
                  </Typography>
                  <ul style={{ paddingLeft: '20px' }}>
                    {industry.benefits.map((benefit, idx) => (
                      <li key={idx}>
                        <Typography variant="body2" color="text.secondary">
                          {benefit}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Business Impact */}
        <Box mt={8}>
          <Typography variant="h4" gutterBottom align="center">
            Proven Business Impact
          </Typography>
          <Grid container spacing={3} mt={2}>
            {businessImpact.map((impact, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'stretch', minHeight: 240 }}>
                  <CardContent sx={{ textAlign: "center", flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {impact.metric}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {impact.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {impact.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Technology Stack */}
        <Box mt={8}>
          <Typography variant="h4" gutterBottom align="center">
            Advanced Technology Stack
          </Typography>
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }}>
                <CardContent sx={{ textAlign: 'left', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <AssessmentIcon sx={{ fontSize: 40, color: "primary.main" }} />
                  <Typography variant="h6" gutterBottom mt={2}>
                    AI/ML Engine
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Powered by advanced LSTM and GPT models for predictive analytics, root cause analysis, and intelligent maintenance recommendations.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enables proactive decision-making and reduces downtime.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }}>
                <CardContent sx={{ textAlign: 'left', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <DevicesIcon sx={{ fontSize: 40, color: "primary.main" }} />
                  <Typography variant="h6" gutterBottom mt={2}>
                    IoT Integration
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Support for all major IoT protocols and device manufacturers for seamless connectivity.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ensures real-time data flow and unified device management.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }}>
                <CardContent sx={{ textAlign: 'left', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <StorageIcon sx={{ fontSize: 40, color: "primary.main" }} />
                  <Typography variant="h6" gutterBottom mt={2}>
                    Data Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Advanced data processing with real-time analytics and historical insights for actionable intelligence.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Secure, scalable, and compliant with industry standards.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Call to Action */}
        <Box mt={8} textAlign="center">
          <Typography variant="h5" gutterBottom>
            Ready to Transform Your Maintenance Operations?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Join industry leaders who have already revolutionized their maintenance processes
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default WhyChooseUs;
