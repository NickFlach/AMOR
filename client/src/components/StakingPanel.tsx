import { useState, useEffect } from "react";
import { Loader2, ArrowDownUp, Lock, Unlock, Clock, AlertCircle, Check, X } from "lucide-react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWeb3, useContracts } from "@/lib/web3";
import { CONTRACTS, STAKING_MANAGER_ABI } from "@/lib/contracts";

interface UnstakeRequest {
  id: number;
  amount: string;
  requestedAt: Date;
  unlockAt: Date;
  claimed: boolean;
  cancelled: boolean;
}

export function StakingPanel() {
  const { isConnected, isCorrectNetwork, address, amorBalance, stAmorBalance, activeStake, refreshBalances, signer, readProvider } = useWeb3();
  const { getAmorContract, getStakingContract, getStAmorContract } = useContracts();
  const { toast } = useToast();

  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [withdrawalDelay, setWithdrawalDelay] = useState<number>(0);
  const [unstakeRequests, setUnstakeRequests] = useState<UnstakeRequest[]>([]);
  const [allowance, setAllowance] = useState("0");

  // Fetch withdrawal delay and unstake requests
  useEffect(() => {
    async function fetchData() {
      try {
        const stakingContract = new ethers.Contract(CONTRACTS.STAKING_MANAGER, STAKING_MANAGER_ABI, readProvider);
        const delay = await stakingContract.WITHDRAWAL_DELAY();
        setWithdrawalDelay(Number(delay));
      } catch (error) {
        // Default to 7 days if RPC fails
        setWithdrawalDelay(604800);
      }
    }
    fetchData();
  }, [readProvider]);

  // Fetch allowance
  useEffect(() => {
    async function fetchAllowance() {
      if (!address) return;
      try {
        const amorContract = getAmorContract();
        const allowed = await amorContract.allowance(address, CONTRACTS.STAKING_MANAGER);
        setAllowance(ethers.formatEther(allowed));
      } catch (error) {
        console.error("Error fetching allowance:", error);
      }
    }
    fetchAllowance();
  }, [address, getAmorContract]);

  const needsApproval = parseFloat(stakeAmount || "0") > parseFloat(allowance);

  async function handleApprove() {
    if (!signer) return;
    setIsApproving(true);
    try {
      const amorContract = getAmorContract(true);
      const tx = await amorContract.approve(CONTRACTS.STAKING_MANAGER, ethers.MaxUint256);
      toast({
        title: "Approval Pending",
        description: "Waiting for transaction confirmation...",
      });
      await tx.wait();
      toast({
        title: "Approved",
        description: "You can now stake AMOR tokens.",
      });
      const allowed = await amorContract.allowance(address, CONTRACTS.STAKING_MANAGER);
      setAllowance(ethers.formatEther(allowed));
    } catch (error: unknown) {
      toast({
        title: "Approval Failed",
        description: (error as Error).message || "Transaction was rejected.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  }

  async function handleStake() {
    if (!stakeAmount || !signer) return;
    setIsStaking(true);
    try {
      const stakingContract = getStakingContract(true);
      const amount = ethers.parseEther(stakeAmount);
      const tx = await stakingContract.stake(amount);
      toast({
        title: "Staking Pending",
        description: "Waiting for transaction confirmation...",
      });
      await tx.wait();
      toast({
        title: "Staked Successfully",
        description: `You staked ${stakeAmount} AMOR and received stAMOR.`,
      });
      setStakeAmount("");
      await refreshBalances();
    } catch (error: unknown) {
      toast({
        title: "Staking Failed",
        description: (error as Error).message || "Transaction was rejected.",
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  }

  async function handleRequestUnstake() {
    if (!unstakeAmount || !signer) return;
    setIsUnstaking(true);
    try {
      const stakingContract = getStakingContract(true);
      const amount = ethers.parseEther(unstakeAmount);
      const tx = await stakingContract.requestUnstake(amount);
      toast({
        title: "Unstake Request Pending",
        description: "Waiting for transaction confirmation...",
      });
      await tx.wait();
      toast({
        title: "Unstake Requested",
        description: `Your ${unstakeAmount} AMOR will be available after the cooldown period.`,
      });
      setUnstakeAmount("");
      await refreshBalances();
    } catch (error: unknown) {
      toast({
        title: "Unstake Request Failed",
        description: (error as Error).message || "Transaction was rejected.",
        variant: "destructive",
      });
    } finally {
      setIsUnstaking(false);
    }
  }

  async function handleDelegate() {
    if (!address || !signer) return;
    try {
      const stAmorContract = getStAmorContract(true);
      const tx = await stAmorContract.delegate(address);
      toast({
        title: "Delegation Pending",
        description: "Waiting for transaction confirmation...",
      });
      await tx.wait();
      toast({
        title: "Delegated Successfully",
        description: "Your voting power is now active.",
      });
      await refreshBalances();
    } catch (error: unknown) {
      toast({
        title: "Delegation Failed",
        description: (error as Error).message || "Transaction was rejected.",
        variant: "destructive",
      });
    }
  }

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${seconds} seconds`;
  };

  if (!isConnected) {
    return (
      <section id="staking" className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Lock className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">Connect Your Wallet</h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                Connect your wallet to stake AMOR tokens and participate in governance.
              </p>
              <appkit-button data-testid="button-connect-staking" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <section id="staking" className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h3 className="mt-4 text-xl font-semibold">Wrong Network</h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                Please switch to Neo X Mainnet to use this application.
              </p>
              <appkit-network-button data-testid="button-switch-network-staking" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="staking" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Staking</h2>
          <p className="mt-2 text-muted-foreground">
            Stake AMOR to receive stAMOR and earn governance voting power.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Stake Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Stake AMOR
              </CardTitle>
              <CardDescription>
                Stake your AMOR tokens to receive stAMOR voting tokens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stake-amount">Amount to Stake</Label>
                  <button
                    type="button"
                    onClick={() => setStakeAmount(amorBalance)}
                    className="text-xs text-primary hover:underline"
                    data-testid="button-max-stake"
                  >
                    Max: {parseFloat(amorBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} AMOR
                  </button>
                </div>
                <Input
                  id="stake-amount"
                  type="number"
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="font-mono"
                  data-testid="input-stake-amount"
                />
              </div>

              {needsApproval ? (
                <Button
                  className="w-full"
                  onClick={handleApprove}
                  disabled={isApproving || !stakeAmount}
                  data-testid="button-approve"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Approve AMOR</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleStake}
                  disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                  data-testid="button-stake"
                >
                  {isStaking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Staking...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Stake AMOR</span>
                    </>
                  )}
                </Button>
              )}

              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span className="font-mono">1 AMOR = 1 stAMOR</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unstake Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5" />
                Unstake AMOR
              </CardTitle>
              <CardDescription>
                Request to unstake your AMOR tokens. Cooldown: {formatDuration(withdrawalDelay)}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="unstake-amount">Amount to Unstake</Label>
                  <button
                    type="button"
                    onClick={() => setUnstakeAmount(activeStake)}
                    className="text-xs text-primary hover:underline"
                    data-testid="button-max-unstake"
                  >
                    Max: {parseFloat(activeStake).toLocaleString(undefined, { maximumFractionDigits: 4 })} AMOR
                  </button>
                </div>
                <Input
                  id="unstake-amount"
                  type="number"
                  placeholder="0.0"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="font-mono"
                  data-testid="input-unstake-amount"
                />
              </div>

              <Button
                className="w-full"
                variant="secondary"
                onClick={handleRequestUnstake}
                disabled={isUnstaking || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                data-testid="button-request-unstake"
              >
                {isUnstaking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Request Unstake</span>
                  </>
                )}
              </Button>

              <div className="rounded-md bg-muted p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cooldown Period</span>
                  <span className="font-mono">{formatDuration(withdrawalDelay)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your Active Stake</span>
                  <span className="font-mono">{parseFloat(activeStake).toLocaleString(undefined, { maximumFractionDigits: 4 })} AMOR</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delegation Card */}
        <Card className="mt-6">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-1/10">
                <Vote className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <h3 className="font-semibold">Activate Voting Power</h3>
                <p className="text-sm text-muted-foreground">
                  Delegate your stAMOR to yourself to activate your voting power for governance proposals.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleDelegate} data-testid="button-delegate">
              <ArrowDownUp className="h-4 w-4" />
              <span>Self-Delegate</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Vote(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="m9 12 2 2 4-4" />
      <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" />
      <path d="M22 19H2" />
    </svg>
  );
}
