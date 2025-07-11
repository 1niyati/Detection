"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Clock, Send, AlertTriangle } from "lucide-react"

export function ContactSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Reset form
    setFormData({ fullName: "", email: "", company: "", message: "" })
    setIsSubmitting(false)

    // You could add a success toast here
    alert("Message sent successfully! Our team will get back to you soon.")
  }

  const supportOptions = [
    { name: "Sales Inquiries", status: "Available", color: "bg-green-600" },
    { name: "Technical Support", status: "24/7", color: "bg-blue-600" },
    { name: "Implementation Services", status: "Custom", color: "bg-purple-600" },
    { name: "Training & Consultation", status: "Premium", color: "bg-orange-600" },
  ]

  return (
    <section className="container mx-auto px-4 py-20" id="contact">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Contact Our Team
        </h2>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Ready to enhance your security operations? Get in touch with our experts.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        {/* Contact Form */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-xl">
              <Send className="w-5 h-5 text-cyan-400 mr-2" />
              Send us a Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@company.com"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-2">
                  Company/Organization
                </label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Your Company Name"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                  Message *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us about your security needs..."
                  rows={6}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Message...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Send Message
                    <Send className="ml-2 w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="space-y-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-xl">Get in Touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Email</h3>
                  <p className="text-slate-300">contact@sentinelsoc.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Phone</h3>
                  <p className="text-slate-300">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Address</h3>
                  <p className="text-slate-300">
                    123 Security Boulevard
                    <br />
                    Cyber City, CC 12345
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Clock className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Business Hours</h3>
                  <p className="text-slate-300">
                    Mon-Fri: 9:00 AM - 6:00 PM PST
                    <br />
                    24/7 Emergency Support Available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Options */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-xl">Support Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supportOptions.map((option, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-300">{option.name}</span>
                  <Badge className={`${option.color} text-white`}>{option.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Emergency Support */}
          <Card className="bg-red-900/20 border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center text-xl">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Emergency Security Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">For critical security incidents requiring immediate assistance:</p>
              <div className="text-center">
                <a
                  href="tel:+15559115621"
                  className="text-2xl font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  +1 (555) 911-SOC1
                </a>
                <p className="text-slate-400 text-sm mt-2">Available 24/7/365 for existing customers</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="mt-16 pt-8 border-t border-slate-700/50 text-center">
        <p className="text-slate-400 text-sm">
          Trusted by enterprise security teams worldwide • SOC 2 Type II Certified • ISO 27001 Compliant
        </p>
      </div>
    </section>
  )
}
