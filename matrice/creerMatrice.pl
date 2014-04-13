




#!/usr/bin/perl
use strict;
use warnings;
my @tab;

while (<>) {
  #chomp($_);
  if ($_ =~ /^[A-Z]\s*/){
  	$_=~s/[A-Z]\s\s/[/;
  	$_=~s/[A-Z]\s/[/;
  	$_=~s/-\d\s$/]/;
  	$_=~s/\s\s/,s/mg;
  	$_=~s/\s/,/mg;
  	push(@tab,$_);
  }
}

for (my $i=0; $i<=$#tab; $i++){
	
  print "$tab[$i] \n";
  
}