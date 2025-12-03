
#
# This will help ensure the proper Jekyll version is running.
# Happy Jekylling!

gem "jekyll", "~> 4.1.0"

# Stdlib gems that became separate gems in newer Ruby versions (3.4+)
gem "csv"
gem "logger"
gem "base64"
gem "bigdecimal", "~> 3.1"

# This is the default theme for new Jekyll sites. You may change this to anything you like.

# If you want to use GitHub Pages, remove the "gem 'jekyll'" above and
# uncomment the line below. To upgrade, run `bundle update github-pages`.
# gem "github-pages", group: :jekyll_plugins

# If you have any plugins, put them here!
group :jekyll_plugins do
  gem "jekyll-feed",      "~> 0.13"
  gem "jekyll-sitemap",   "~> 1.4"
  gem "jekyll-compose",   "~> 0.12.0"
  gem "jekyll-postfiles", "~> 3.1"
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
# (use :windows instead of the deprecated :mingw / :x64_mingw platform tags)
gem "tzinfo-data", platforms: [:windows, :jruby]

# Performance-booster for watching directories on Windows
if Gem::Version.new(RUBY_VERSION) < Gem::Version.new("3.2.0") && Gem.win_platform?
  gem "wdm", ">= 0.1.0"
end

gem "webrick", "~> 1.7"