import { Button, Heading } from "@medusajs/ui"
import InteractiveLink from "@modules/common/components/interactive-link"
import { Github } from "@medusajs/icons"
import Link from "next/link"
import ArrowRight from "@modules/common/icons/arrow-right"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 text-center small:p-32">
        <span>
          <Heading
            level="h1"
            className="text-3xl font-normal leading-10 text-ui-fg-base"
          >
            Ecommerce Starter Template with Paystack Integration
          </Heading>
          <Heading
            level="h2"
            className="text-3xl font-normal leading-10 text-ui-fg-subtle"
          >
            Powered by Medusa and Next.js
          </Heading>
        </span>
        <div className="flex gap-4">
          <a
            href="https://github.com/a11rew/medusa-payment-paystack"
            target="_blank"
          >
            <Button variant="secondary">
              View on GitHub
              <Github />
            </Button>
          </a>
          <Link href="/store">
            <Button variant="secondary">
              Go to Store
              <ArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Hero
