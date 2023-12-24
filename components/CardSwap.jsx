import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Button,
  Image,
  User,
  Tabs,
  Chip,
  Tab,
} from "@nextui-org/react";

import toast, { Toaster } from "react-hot-toast";
import { Input } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/react";
import { isAddress, formatUnits, pad, parseUnits } from "viem";
import { ChainSelect } from "@/const/ChainSelect";
import { useNetwork, useAccount, readContracts } from "wagmi";
import { writeContract, waitForTransaction } from "@wagmi/core";
import { useState, useEffect } from "react";
import { OFTV2_ABI } from "@/const/ABI/OFT";

export default function CardSwap() {
  const { chain } = useNetwork();
  const { address } = useAccount();

  const [contractAddress, setcontractAddress] = useState();
  const [destChain, setdestChain] = useState();
  const [amount, setAmount] = useState("0");
  const [extraGas, setextraGas] = useState(0);
  const [errorFee, setErrorFee] = useState(false);
  const [errorToken, setErrorToken] = useState(false);
  const [selector, setSelector] = useState(ChainSelect);
  const [fee, setFee] = useState("0");
  const [totalGas, setTotalGas] = useState();
  const [tokenMetadata, settokenMetadata] = useState({
    balance: "0",
    decimal: 18,
    name: "",
  });

  const [errorTx, seterrorTx] = useState({
    status: false,
    text: "",
  });
  const [successTx, setsuccessTx] = useState({
    status: false,
    text: "",
    hash: "",
  });

  function HandleChangeContractAddress(event) {
    const contractAddress = event.target.value;
    if (isAddress(contractAddress)) {
      setcontractAddress(contractAddress);
      fetchTokenMetaData(contractAddress);
    } else {
      toast.error("Please enter valid contract address");
    }
  }

  async function fetchTokenMetaData(CA) {
    const OFT = {
      address: CA,
      abi: OFTV2_ABI,
    };

    const data = await readContracts({
      contracts: [
        {
          ...OFT,
          functionName: "balanceOf",
          args: [address],
        },
        {
          ...OFT,
          functionName: "decimals",
        },
        {
          ...OFT,
          functionName: "name",
        },
      ],
    });

    if (data[0].result !== undefined) {
      console.log(data[0].result);
      let tokenData = {
        balance: data[0].result.toString(),
        decimal: data[1].result,
        name: data[2].result,
      };
      settokenMetadata(tokenData);
      setErrorToken(false);
    } else {
      let tokenData = {
        balance: "",
        decimal: "",
        name: "",
      };
      settokenMetadata(tokenData);
      setErrorToken(true);
    }
  }

  async function quoteLayerzeroFee(l0ChainId) {
    const OFT = {
      address: contractAddress,
      abi: OFTV2_ABI,
    };

    const data = await readContracts({
      contracts: [
        {
          ...OFT,
          functionName: "estimateSendFee",
          args: [
            l0ChainId,
            pad(address, 32),
            parseUnits(amount, tokenMetadata.decimal),
            false,
            "0x",
          ],
        },
      ],
    });

    console.log(data);
    if (data[0].result !== undefined) {
      setFee(data[0].result[0].toString());
      setErrorFee(false);
    } else {
      setFee(undefined);
      setErrorFee(true);
    }
  }

  function HandleChangeDestinationChain(event) {
    const destChain = event.target.value;
    const findBynetwork = ChainSelect.find((e) => e.value == destChain);
    setdestChain(findBynetwork.L0ChainId);
    quoteLayerzeroFee(findBynetwork.L0ChainId);
  }

  function HandleChangeAmount(event) {
    const balance = Number(
      formatUnits(tokenMetadata.balance, tokenMetadata.decimal)
    ).toFixed(0);

    console.log(`Balance ${balance}`);
    const amounts = event.target.value;
    if (Number(amounts) > Number(balance)) {
      setAmount(balance);
    } else {
      setAmount(amounts);
    }
  }

  function HandleChangeExtraGas(event) {
    const extraGas = event.target.value;
    let gasWithExtra = BigInt(fee) + (BigInt(fee) * BigInt(extraGas)) / 100n;
    setextraGas(extraGas);
    setTotalGas(gasWithExtra);
  }

  Array.prototype.remove = function (key, value) {
    const index = this.findIndex((obj) => obj[key] === value);
    return index >= 0
      ? [...this.slice(0, index), ...this.slice(index + 1)]
      : this;
  };

  useEffect(() => {
    const currentChain = chain?.id;
    let newList = ChainSelect.remove("chainId", currentChain);
    setSelector(newList);
  }, [chain]);

  useEffect(() => {
    (async () => {
      await fetchTokenMetaData(contractAddress);
      await quoteLayerzeroFee(destChain);

      setsuccessTx({
        status: false,
        text: "",
        hash: "",
      });

      seterrorTx({
        status: false,
        text: "",
      });
    })();
  }, [amount, chain, destChain, contractAddress, extraGas]);

  async function handleBridge() {
    setsuccessTx({
      status: false,
      text: "",
      hash: "",
    });

    seterrorTx({
      status: false,
      text: "",
    });
    if (chain.name == "Canto" || chain.name == "Polygon") {
      try {
        const { hash } = await writeContract({
          address: contractAddress,
          abi: OFTV2_ABI,
          functionName: "sendFrom",
          value: totalGas,
          gas: 1500000n,
          args: [
            address,
            destChain,
            pad(address, 32),
            parseUnits(amount, tokenMetadata.decimal),
            [
              address,
              "0x0000000000000000000000000000000000000000",
              "0x00010000000000000000000000000000000000000000000000000000000000030d40",
            ],
          ],
        });

        if (hash) {
          setsuccessTx({
            status: true,
            text: "Sucess Sending OFT to Layerzero",
            hash: hash,
          });
        }
      } catch (err) {
        console.log(err);
        if (err.details) {
          seterrorTx({
            status: true,
            text: err.details,
          });
        } else {
          seterrorTx({
            status: true,
            text: err.name,
          });
        }
      }
    } else {
      try {
        const { hash } = await writeContract({
          address: contractAddress,
          abi: OFTV2_ABI,
          functionName: "sendFrom",
          value: totalGas,
          args: [
            address,
            destChain,
            pad(address, 32),
            parseUnits(amount, tokenMetadata.decimal),
            [
              address,
              "0x0000000000000000000000000000000000000000",
              "0x00010000000000000000000000000000000000000000000000000000000000030d40",
            ],
          ],
        });

        if (hash) {
          setsuccessTx({
            status: true,
            text: "Sucess Sending OFT to Layerzero",
            hash: hash,
          });
        }
      } catch (err) {
        console.log(err);
        if (err.details) {
          toast.error(<span>{err.details}</span>);
          seterrorTx({
            status: true,
            text: err.details,
          });
        } else {
          seterrorTx({
            status: true,
            text: err.name,
          });
        }
      }
    }
  }

  return (
    <Card className="max-w-[800px] lg:min-w-[800px]">
      <Toaster position="top-right" reverseOrder={false} />
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="/zero.jpg"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Powered By Layerjawa</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="flex w-full flex-wrap md:flex-nowrap gap-4 mb-3">
          <Input
            required={true}
            type="text"
            label="OFT Contract Address"
            placeholder="0x9e20461bc2c4c980f62f1B279D71734207a6A356"
            onChange={HandleChangeContractAddress}
          />
        </div>

        {tokenMetadata?.name?.length > 0 ? (
          <div className="flex gap-4 mb-3">
            <Chip radius="sm" color="success">
              Balance:
              {Number(
                formatUnits(tokenMetadata.balance, tokenMetadata.decimal)
              ).toFixed(0)}
            </Chip>
            <Chip radius="sm" color="success">
              Decimal: {tokenMetadata.decimal}
            </Chip>
            <Chip radius="sm" color="success">
              Name: {tokenMetadata.name}
            </Chip>
          </div>
        ) : (
          ""
        )}

        {errorToken === true && contractAddress !== undefined ? (
          <Chip radius="sm" color="danger" className="mb-3">
            Can't Bridge! Please Enter Valid OFT Address.
          </Chip>
        ) : (
          ""
        )}

        {contractAddress !== undefined && errorToken == false ? (
          <div className="flex w-full flex-wrap md:flex-nowrap gap-4 mb-3">
            <Select
              onChange={HandleChangeDestinationChain}
              disallowEmptySelection={true}
              isDisabled={contractAddress !== undefined ? false : true}
              isRequired={true}
              label="Destination Chain"
            >
              {selector.map((v) => (
                <SelectItem
                  className="text-white"
                  key={v.value}
                  value={v.value}
                  startContent={
                    <Image
                      alt={v.label}
                      height={20}
                      radius="sm"
                      src={v.icon}
                      width={20}
                      value={v.name}
                    />
                  }
                >
                  {v.label}
                </SelectItem>
              ))}
            </Select>
            <Input
              type="number"
              label="Amount"
              value={amount}
              disabled={contractAddress !== undefined ? false : true}
              onChange={HandleChangeAmount}
              placeholder="Enter Amount"
            />
            <Input
              type="number"
              label="Extra Gas (%)"
              placeholder="Tambah Extra Gas"
              value={extraGas}
              disabled={contractAddress !== undefined ? false : true}
              onChange={HandleChangeExtraGas}
            />
          </div>
        ) : (
          ""
        )}

        <div className="flex gap-4 mb-3">
          {fee !== undefined && fee > 0 ? (
            <Chip radius="sm" color="warning">
              LayerZero Fee :{" "}
              {totalGas > 0
                ? Number(formatUnits(totalGas, 18)).toFixed(5)
                : Number(formatUnits(fee, 18)).toFixed(5)}
              {chain.nativeCurrency.symbol}
            </Chip>
          ) : (
            ""
          )}

          {errorFee === true && destChain !== undefined ? (
            <Chip radius="sm" color="danger">
              Can't Bridge! Calculation LayerZero Fee Failed.
            </Chip>
          ) : (
            ""
          )}
        </div>

        <Button
          isDisabled={
            contractAddress !== undefined &&
            errorToken == false &&
            errorFee == false
              ? false
              : true
          }
          color="primary"
          onClick={handleBridge}
        >
          Bridge
        </Button>
      </CardBody>
      <Divider />
      {errorTx.status == true ? (
        <CardFooter>
          <Image
            alt="nextui logo"
            height={20}
            radius="sm"
            src="/icon/info.svg"
            width={20}
          />
          <span className="mr-2"></span>
          <div className="flex flex-col">
            <pre className="text-red-600">{errorTx.text} </pre>
          </div>
        </CardFooter>
      ) : (
        ""
      )}

      {successTx.status == true ? (
        <CardFooter>
          <Image
            alt="nextui logo"
            height={20}
            radius="sm"
            src="/icon/info.svg"
            width={20}
          />
          <span className="mr-2"></span>
          <div className="flex flex-col">
            <pre className="text-green-600">
              {successTx.text}
              <a
                href={`https://layerzeroscan.com/tx/${successTx.hash}`}
                target="_blank"
              >
                Check Explorer
              </a>
            </pre>
          </div>
        </CardFooter>
      ) : (
        ""
      )}
      <CardFooter>
        <Image
          alt="nextui logo"
          height={20}
          radius="sm"
          src="/icon/info.svg"
          width={20}
        />
        <span className="mr-2"></span>
        <div className="flex flex-col">
          <p className="text-md">Mohon selalu cek contract dan chain tujuan</p>
        </div>
      </CardFooter>
      <CardFooter>
        <div className="flex w-full flex-col">
          <Tabs aria-label="Options">
            <Tab key="alpha" title="Alpha">
              <Card>
                <CardBody>
                  This bridge is still in Alpha Version please use at your own
                  risk!
                </CardBody>
              </Card>
            </Tab>
            <Tab key="tips" title="Tips">
              <Card>
                <CardBody>
                  Pastikan OFT tersedia di chain tujuan dan mohon test bridge
                  dengan nominal kecil dahulu.
                  <br />
                  Jika Error Tambahkan Extra Gas Fee / Pilih Chain Lain
                </CardBody>
              </Card>
            </Tab>
            <Tab key="liquidity" title="Liquidity">
              <Card>
                <CardBody>
                  Pastikan cek dahulu apakah OFT dichain tujuan terdapat
                  liquidity
                </CardBody>
              </Card>
            </Tab>
            <Tab key="extragas" title="Extra Gas">
              <Card>
                <CardBody>
                  Jika transaksi gagal coba untuk menambah extra gas
                </CardBody>
              </Card>
            </Tab>
            <Tab key="about" title="About">
              <Card>
                <CardBody>
                  Dibuat oleh{" "}
                  <a href="https://t.me/zkmev" target="_blank">
                    @zkmev
                  </a>
                  Join Group
                  <a href="https://t.me/diary_mh" target="_blank">
                    @Telegram
                  </a>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </CardFooter>
    </Card>
  );
}
